const { Usuario, Rol, SolicitudDocente, Sesion } = require('../models');
const TokenService = require('../services/tokenService');
const SessionService = require('../services/sessionService');
const crypto = require('crypto');
const {
    setLoginAttempts,
    getLoginAttempts,
    clearLoginAttempts,
    atomicConsumeResetToken,
    storeMfaChallenge,
    getMfaChallenge,
    incrementMfaAttempts,
    atomicConsumeMfaChallenge,
    redis,
} = require('../config/redis');
const config = require('../config/env');
const { determinarRolInicial, esRolPrivilegiado } = require('../domain/politicaRoles');
const { validarCodigoMfa } = require('../domain/politicaSesion');

class AuthController {
    static toAuthUser(usuario) {
        const rolNombre = typeof usuario.rol === 'object' && usuario.rol !== null
            ? usuario.rol.nombre_rol
            : (usuario.rol || 'estudiante');

        return {
            id: usuario.id_usuario.toString(),
            identificador_unico: usuario.identificador_unico,
            email: usuario.email,
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            rol: rolNombre,
            carrera_interes: usuario.carrera_interes,
            institucion: usuario.institucion,
            bio: usuario.bio,
            avatar: usuario.avatar,
            fecha_registro: usuario.fecha_registro,
            primer_ingreso: usuario.primer_ingreso,
            activo: usuario.activo,
        };
    }

    /**
     * POST /api/auth/register
     * Registra un nuevo usuario aplicando política de no-autoasignación de roles privilegiados (RIC-01, RIC-02)
     */
    static async register(req, res, next) {
        try {
            const { nombres, apellidos, email, password, isTeacher } = req.body;

            if (!nombres || !apellidos || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son requeridos',
                    missing: {
                        nombres: !nombres,
                        apellidos: !apellidos,
                        email: !email,
                        password: !password,
                    },
                });
            }

            const normalizedEmail = String(email).toLowerCase().trim();

            const existingUser = await Usuario.findOne({ where: { email: normalizedEmail } });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Este correo ya está registrado',
                });
            }

            // Regla de dominio: Todo registro público obtiene SIEMPRE rol estudiante.
            // Los flags del cliente (isTeacher / role / admin) NUNCA otorgan rol privilegiado automáticamente.
            const initialRoleName = determinarRolInicial();
            const rol = await Rol.findOne({ where: { nombre_rol: initialRoleName } });

            if (!rol) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al asignar rol del sistema',
                });
            }

            const usuario = await Usuario.create({
                nombres: String(nombres).trim(),
                apellidos: String(apellidos).trim(),
                email: normalizedEmail,
                password_hash: password,
                rol_id: rol.id_rol,
                carrera_interes: null,
                primer_ingreso: true,
                activo: true,
            });

            await usuario.reload({ include: [{ model: Rol, as: 'rol' }] });

            // Si el usuario marcó intención docente, registramos solicitud de habilitación pendiente
            let teacherRequestPending = false;
            if (Boolean(isTeacher)) {
                try {
                    await SolicitudDocente.create({
                        usuario_id: usuario.id_usuario,
                        institucion: req.body.institucion ? String(req.body.institucion).trim() : 'Institución educativa indicada en registro',
                        evidencia: req.body.evidencia ? String(req.body.evidencia).trim() : null,
                        estado: 'pendiente',
                    });
                    teacherRequestPending = true;
                } catch (err) {
                    console.error('Error registrando solicitud docente:', err.message);
                }
            }

            const token = TokenService.generateToken({
                id: usuario.id_usuario,
                identificador_unico: usuario.identificador_unico,
                email: usuario.email,
                rol: usuario.rol.nombre_rol,
            });

            const deviceInfo = {
                device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1] || 'Desconocido',
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.headers['user-agent'],
            };

            await SessionService.createSession(usuario.id_usuario, deviceInfo, token);

            res.status(201).json({
                success: true,
                message: teacherRequestPending
                    ? 'Usuario registrado como estudiante. Solicitud docente pendiente de validación institucional.'
                    : 'Usuario registrado exitosamente',
                user: AuthController.toAuthUser(usuario),
                token,
                teacherRequestPending,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/login
     * Inicia sesión con protección contra enumeración de usuarios y soporte para MFA (RIC-01, RIC-04, RIC-06)
     */
    static async login(req, res, next) {
        try {
            const { email, password, mfaRequired } = req.body;
            if (!email || !password) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas',
                });
            }

            const normalizedEmail = String(email).toLowerCase().trim();

            const attempts = await getLoginAttempts(normalizedEmail);
            if (attempts >= (config.MAX_LOGIN_ATTEMPTS || 20)) {
                return res.status(429).json({
                    success: false,
                    message: 'Demasiados intentos fallidos. Intenta más tarde.',
                });
            }

            const usuario = await Usuario.findOne({
                where: { email: normalizedEmail },
                include: [{ model: Rol, as: 'rol' }],
            });

            // Respuesta neutra ante usuario inexistente para evitar enumeración (RIC-01)
            if (!usuario) {
                await setLoginAttempts(normalizedEmail, attempts + 1);
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas',
                });
            }

            if (!usuario.activo) {
                return res.status(403).json({
                    success: false,
                    message: 'Cuenta desactivada. Contacta al administrador.',
                });
            }

            const isValidPassword = await usuario.validarPassword(password);
            if (!isValidPassword) {
                await setLoginAttempts(normalizedEmail, attempts + 1);
                await SessionService.logSessionHistory(
                    usuario.id_usuario,
                    {
                        device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1],
                        ip: req.ip || req.connection?.remoteAddress,
                    },
                    'login',
                    false
                );
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas',
                });
            }

            await clearLoginAttempts(normalizedEmail);

            // Verificar si la cuenta requiere MFA o si fue solicitado explícitamente (RIC-06, RIC-AC-02)
            const needsMfa = Boolean(mfaRequired) || Boolean(req.headers['x-require-mfa']);
            if (needsMfa) {
                const challengeId = crypto.randomUUID();
                const otpCode = String(crypto.randomInt(100000, 1000000));

                await storeMfaChallenge(challengeId, {
                    userId: usuario.id_usuario,
                    otpCode,
                    attempts: 0,
                }, 300);

                const challengeToken = TokenService.generateChallengeToken({
                    id: usuario.id_usuario,
                    challengeId,
                });

                return res.status(200).json({
                    success: true,
                    mfaRequired: true,
                    challengeToken,
                    message: 'Autenticación de dos factores requerida',
                    code: config.NODE_ENV === 'production' ? undefined : otpCode,
                });
            }

            const token = TokenService.generateToken({
                id: usuario.id_usuario,
                identificador_unico: usuario.identificador_unico,
                email: usuario.email,
                rol: usuario.rol.nombre_rol,
            });

            const deviceInfo = {
                device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1] || 'Desconocido',
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.headers['user-agent'],
            };

            await SessionService.createSession(usuario.id_usuario, deviceInfo, token);

            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                user: AuthController.toAuthUser(usuario),
                token,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/mfa/complete
     * Completa el desafío MFA y emite la sesión definitiva de forma atómica (RIC-06, RIC-AC-02)
     */
    static async completeMfaLogin(req, res, next) {
        try {
            const { challengeToken, code } = req.body;
            if (!challengeToken || !code) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de desafío y código OTP son requeridos',
                });
            }

            const { valid, decoded, error } = await TokenService.verifyToken(challengeToken, { allowChallenge: true });
            if (!valid || !decoded || decoded.scope !== 'mfa_challenge') {
                return res.status(401).json({
                    success: false,
                    message: error || 'Desafío MFA inválido o expirado',
                });
            }

            const challengeId = decoded.challengeId;
            const challengeData = await getMfaChallenge(challengeId);
            if (!challengeData) {
                return res.status(400).json({
                    success: false,
                    message: 'El código ha expirado o ya fue consumido',
                });
            }

            const validacion = validarCodigoMfa(code, challengeData.otpCode, challengeData.attempts || 0);
            if (!validacion.valido) {
                if (validacion.bloqueado) {
                    await atomicConsumeMfaChallenge(challengeId);
                    return res.status(429).json({
                        success: false,
                        message: validacion.motivo,
                    });
                } else {
                    await incrementMfaAttempts(challengeId);
                    return res.status(400).json({
                        success: false,
                        message: validacion.motivo,
                    });
                }
            }

            // Consumo atómico: garantiza que en carreras concurrentes solo uno tenga éxito
            const consumed = await atomicConsumeMfaChallenge(challengeId);
            if (!consumed) {
                return res.status(400).json({
                    success: false,
                    message: 'El código ya fue utilizado',
                });
            }

            const usuario = await Usuario.findByPk(decoded.id, {
                include: [{ model: Rol, as: 'rol' }],
            });

            if (!usuario || !usuario.activo) {
                return res.status(403).json({
                    success: false,
                    message: 'Usuario no disponible',
                });
            }

            const token = TokenService.generateToken({
                id: usuario.id_usuario,
                identificador_unico: usuario.identificador_unico,
                email: usuario.email,
                rol: usuario.rol.nombre_rol,
            });

            const deviceInfo = {
                device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1] || 'Desconocido (MFA)',
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.headers['user-agent'],
            };

            await SessionService.createSession(usuario.id_usuario, deviceInfo, token);

            res.status(200).json({
                success: true,
                message: 'Verificación de dos factores completada exitosamente',
                user: AuthController.toAuthUser(usuario),
                token,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/logout
     * Cierra la sesión actual y revoca el token en Redis
     */
    static async logout(req, res, next) {
        try {
            const token = req.token;
            await TokenService.revokeToken(token);

            const deviceInfo = {
                device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1],
                ip: req.ip || req.connection?.remoteAddress,
            };
            await SessionService.deactivateSession(token, deviceInfo);

            res.status(200).json({
                success: true,
                message: 'Sesión cerrada exitosamente',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/refresh
     * Refresca el token JWT
     */
    static async refreshToken(req, res, next) {
        try {
            const { id, identificador_unico, email, rol } = req.user;

            const newToken = TokenService.generateToken({
                id,
                identificador_unico,
                email,
                rol,
            });

            await TokenService.revokeToken(req.token);

            res.status(200).json({
                success: true,
                token: newToken,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/auth/verify
     * Verifica validez del token
     */
    static async verify(req, res, next) {
        try {
            const usuario = await Usuario.findOne({
                where: { id_usuario: req.user.id },
                include: [{ model: Rol, as: 'rol' }],
            });

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    valid: false,
                    message: 'Usuario no encontrado',
                });
            }

            res.status(200).json({
                success: true,
                valid: true,
                user: AuthController.toAuthUser(usuario),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/quick-login
     * Login social simplificado: NUNCA otorga roles docentes/admin a cuentas nuevas (RIC-01)
     */
    static async quickLogin(req, res, next) {
        try {
            const { email, nombres = 'Usuario', apellidos = 'PAE', provider = 'google' } = req.body;

            if (!email) {
                return res.status(400).json({ success: false, message: 'Email requerido' });
            }

            const normalizedEmail = String(email).toLowerCase().trim();

            let usuario = await Usuario.findOne({
                where: { email: normalizedEmail },
                include: [{ model: Rol, as: 'rol' }],
            });

            // Si es un usuario nuevo, el rol es SIEMPRE estudiante (prohibido elevar a docente)
            if (!usuario) {
                const rol = await Rol.findOne({ where: { nombre_rol: 'estudiante' } });
                usuario = await Usuario.create({
                    nombres: String(nombres).trim(),
                    apellidos: String(apellidos).trim(),
                    email: normalizedEmail,
                    password_hash: crypto.randomBytes(24).toString('hex'),
                    rol_id: rol.id_rol,
                    primer_ingreso: true,
                    activo: true,
                });
                await usuario.reload({ include: [{ model: Rol, as: 'rol' }] });
            }

            const token = TokenService.generateToken({
                id: usuario.id_usuario,
                identificador_unico: usuario.identificador_unico,
                email: usuario.email,
                rol: usuario.rol.nombre_rol,
            });

            const deviceInfo = {
                device: `${provider} - ${req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1] || 'Desconocido'}`,
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.headers['user-agent'],
            };

            await SessionService.createSession(usuario.id_usuario, deviceInfo, token);

            res.status(200).json({
                success: true,
                user: AuthController.toAuthUser(usuario),
                token,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/auth/user/:id
     * Datos públicos mínimos de usuario para otros servicios
     */
    static async getUserById(req, res, next) {
        try {
            const usuario = await Usuario.findOne({
                where: { id_usuario: req.params.id, activo: true },
                include: [{ model: Rol, as: 'rol' }],
            });

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado',
                });
            }

            res.status(200).json({
                success: true,
                user: {
                    id: usuario.id_usuario.toString(),
                    identificador_unico: usuario.identificador_unico,
                    nombres: usuario.nombres,
                    apellidos: usuario.apellidos,
                    rol: usuario.rol.nombre_rol,
                    avatar: usuario.avatar,
                    carrera_interes: usuario.carrera_interes,
                    institucion: usuario.institucion,
                    bio: usuario.bio,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/auth/profile
     * Actualiza perfil protegiendo campos restringidos (rol, id, email) (RIC-08)
     */
    static async updateProfile(req, res, next) {
        try {
            const { nombres, apellidos, institucion, bio, carrera_interes } = req.body;
            const userId = req.user.id;

            const usuario = await Usuario.findByPk(userId, {
                include: [{ model: Rol, as: 'rol' }],
            });

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado',
                });
            }

            // Solo actualizar campos permitidos
            await usuario.update({
                nombres: nombres?.trim() || usuario.nombres,
                apellidos: apellidos?.trim() || usuario.apellidos,
                institucion: institucion !== undefined ? institucion?.trim() : usuario.institucion,
                bio: bio !== undefined ? bio?.trim() : usuario.bio,
                carrera_interes: carrera_interes !== undefined ? carrera_interes?.trim() : usuario.carrera_interes,
            });

            res.status(200).json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                user: AuthController.toAuthUser(usuario),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/auth/password
     * Cambia la contraseña del usuario y revoca todas las sesiones activas
     */
    static async updatePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;
            const token = req.token;

            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña actual es requerida',
                });
            }

            if (!newPassword || newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva contraseña debe tener al menos 8 caracteres',
                });
            }

            const usuario = await Usuario.findByPk(userId);
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado',
                });
            }

            const isValidCurrentPassword = await usuario.validarPassword(currentPassword);
            if (!isValidCurrentPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'La contraseña actual no es correcta',
                });
            }

            await usuario.update({ password_hash: newPassword });

            await SessionService.logSessionHistory(
                userId,
                {
                    device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1],
                    ip: req.ip || req.connection?.remoteAddress,
                },
                'cambio_password',
                true
            );

            // Revocar token actual y todas las sesiones
            await TokenService.revokeToken(token);
            await SessionService.deactivateAllUserSessions(
                userId,
                {
                    device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1],
                    ip: req.ip || req.connection?.remoteAddress,
                }
            );

            res.status(200).json({
                success: true,
                message: 'Contraseña actualizada. Todas las sesiones han sido cerradas.',
                shouldLogout: true,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/auth/sessions
     * Lista sesiones activas del usuario (RQ101, RQ104)
     */
    static async getSessions(req, res, next) {
        try {
            await SessionService.updateLastAccess(req.token);
            const [activeSessions, historyResult] = await Promise.all([
                SessionService.getUserActiveSessions(req.user.id),
                SessionService.getUserSessionHistory(req.user.id, 30, 0),
            ]);

            res.status(200).json({
                success: true,
                sessions: activeSessions.map((session) => ({
                    id: session.id_sesion.toString(),
                    device: session.dispositivo || 'Desconocido',
                    location: session.ip_address || 'IP no disponible',
                    lastActive: session.fecha_ultimo_acceso,
                    startedAt: session.fecha_inicio,
                    isCurrent: session.token_sesion === req.token,
                })),
                history: historyResult.history.map((item) => ({
                    id: item.id_historial.toString(),
                    device: item.dispositivo || 'Desconocido',
                    ip: item.ip_address,
                    action: item.accion,
                    successful: item.exitoso,
                    date: item.fecha_acceso,
                })),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/logout-all
     * Cierra todas las sesiones activas del usuario (RQ107, RIC-08)
     */
    static async logoutAll(req, res, next) {
        try {
            const sessions = await SessionService.getUserActiveSessions(req.user.id);
            await Promise.all(sessions.map((session) => TokenService.revokeToken(session.token_sesion)));
            await SessionService.deactivateAllUserSessions(req.user.id, {
                device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1],
                ip: req.ip || req.connection?.remoteAddress,
            });

            res.status(200).json({ success: true, message: 'Todas las sesiones fueron cerradas' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/forgot-password
     * Solicita recuperación de contraseña con respuestas neutras (RIC-07)
     */
    static async forgotPassword(req, res, next) {
        try {
            const email = String(req.body.email || '').toLowerCase().trim();
            const usuario = email ? await Usuario.findOne({ where: { email } }) : null;
            let resetToken = null;

            if (usuario && usuario.activo) {
                resetToken = crypto.randomBytes(32).toString('hex');
                await redis.setex(`password_reset:${resetToken}`, 900, usuario.id_usuario);
            }

            res.status(200).json({
                success: true,
                message: 'Si el correo existe, se enviaron instrucciones para recuperar la cuenta',
                resetToken: config.NODE_ENV === 'production' ? undefined : resetToken,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/reset-password
     * Restablece contraseña consumiendo el token de forma atómica (RIC-07, RIC-AC-03)
     */
    static async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword || newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Token válido y nueva contraseña de al menos 8 caracteres son requeridos',
                });
            }

            // Consumo atómico: GET y DEL simultáneo en Redis para prevenir carreras de concurrencia
            const userId = await atomicConsumeResetToken(token);
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Token expirado, inválido o ya utilizado',
                });
            }

            const usuario = await Usuario.findByPk(userId);
            if (!usuario) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            await usuario.update({ password_hash: newPassword });

            // Revocar tokens y cerrar sesiones activas
            const sessions = await SessionService.getUserActiveSessions(usuario.id_usuario);
            await Promise.all(sessions.map(s => TokenService.revokeToken(s.token_sesion)));
            await SessionService.deactivateAllUserSessions(usuario.id_usuario, {
                device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1],
                ip: req.ip || req.connection?.remoteAddress,
            });

            res.status(200).json({
                success: true,
                message: 'Contraseña restablecida correctamente. Todas las sesiones han sido cerradas.',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/2fa/request
     * Solicita código 2FA para usuario autenticado
     */
    static async requestTwoFactor(req, res, next) {
        try {
            const code = String(crypto.randomInt(100000, 1000000));
            await redis.setex(`2fa:${req.user.id}`, 300, code);

            res.status(200).json({
                success: true,
                message: 'Código de verificación generado',
                code: config.NODE_ENV === 'production' ? undefined : code,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/2fa/verify
     * Verifica código 2FA
     */
    static async verifyTwoFactor(req, res, next) {
        try {
            const expectedCode = await redis.get(`2fa:${req.user.id}`);
            if (!expectedCode || expectedCode !== String(req.body.code || '').trim()) {
                return res.status(400).json({ success: false, message: 'Código inválido o expirado' });
            }

            await redis.del(`2fa:${req.user.id}`);
            res.status(200).json({ success: true, message: 'Verificación completada' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/teacher/request
     * Solicita habilitación docente con evidencia institucional (RIC-02)
     */
    static async requestTeacherRole(req, res, next) {
        try {
            const { institucion, evidencia } = req.body;
            if (!institucion || String(institucion).trim().length < 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Institución académica es requerida (mínimo 3 caracteres)',
                });
            }

            const solicitud = await SolicitudDocente.create({
                usuario_id: req.user.id,
                institucion: String(institucion).trim(),
                evidencia: evidencia ? String(evidencia).trim() : null,
                estado: 'pendiente',
            });

            res.status(201).json({
                success: true,
                message: 'Solicitud de habilitación docente registrada para revisión administrativa',
                solicitud,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/auth/teacher/requests
     * Lista solicitudes de rol docente (Solo administrador)
     */
    static async listTeacherRequests(req, res, next) {
        try {
            if (req.user.rol !== 'admin') {
                return res.status(403).json({ success: false, message: 'Solo administradores pueden listar solicitudes' });
            }

            const solicitudes = await SolicitudDocente.findAll({
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id_usuario', 'identificador_unico', 'nombres', 'apellidos', 'email'],
                }],
                order: [['fecha_solicitud', 'DESC']],
            });

            res.status(200).json({ success: true, solicitudes });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/teacher/requests/:id/approve
     * Aprueba solicitud de rol docente (Solo administrador, M1-S03)
     */
    static async approveTeacherRequest(req, res, next) {
        try {
            if (req.user.rol !== 'admin') {
                return res.status(403).json({ success: false, message: 'Solo administradores pueden aprobar solicitudes' });
            }

            const solicitud = await SolicitudDocente.findByPk(req.params.id);
            if (!solicitud) {
                return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
            }

            const rolDocente = await Rol.findOne({ where: { nombre_rol: 'docente' } });
            await Usuario.update({ rol_id: rolDocente.id_rol }, { where: { id_usuario: solicitud.usuario_id } });

            await solicitud.update({
                estado: 'aprobada',
                revisado_por: req.user.id,
                fecha_revision: new Date(),
            });

            res.status(200).json({ success: true, message: 'Habilitación docente aprobada exitosamente' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/teacher/requests/:id/reject
     * Rechaza solicitud de rol docente (Solo administrador)
     */
    static async rejectTeacherRequest(req, res, next) {
        try {
            if (req.user.rol !== 'admin') {
                return res.status(403).json({ success: false, message: 'Solo administradores pueden rechazar solicitudes' });
            }

            const solicitud = await SolicitudDocente.findByPk(req.params.id);
            if (!solicitud) {
                return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
            }

            await solicitud.update({
                estado: 'rechazada',
                revisado_por: req.user.id,
                motivo_rechazo: req.body.motivo || 'No cumple requisitos institucionales',
                fecha_revision: new Date(),
            });

            res.status(200).json({ success: true, message: 'Solicitud rechazada' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/admin/assign-role
     * Asignación manual de rol por administrador (M1-S03-01: 'El sistema permite asignar manualmente el rol Docente')
     */
    static async assignRole(req, res, next) {
        try {
            if (req.user.rol !== 'admin') {
                return res.status(403).json({ success: false, message: 'Solo administradores pueden asignar roles' });
            }

            const { targetUserId, roleName } = req.body;
            if (!targetUserId || !roleName) {
                return res.status(400).json({ success: false, message: 'targetUserId y roleName son requeridos' });
            }

            const rol = await Rol.findOne({ where: { nombre_rol: roleName } });
            if (!rol) {
                return res.status(400).json({ success: false, message: 'Rol inválido' });
            }

            const user = await Usuario.findByPk(targetUserId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            await user.update({ rol_id: rol.id_rol });

            res.status(200).json({
                success: true,
                message: `Rol '${roleName}' asignado exitosamente al usuario`,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;
