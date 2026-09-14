const { Usuario, Rol } = require('../models');
const TokenService = require('../services/tokenService');
const SessionService = require('../services/sessionService');
const crypto = require('crypto');
const {
    setLoginAttempts,
    getLoginAttempts,
    clearLoginAttempts,
    redis,
} = require('../config/redis');
const config = require('../config/env');

class AuthController {
    static toAuthUser(usuario) {
        return {
            id: usuario.id_usuario.toString(),
            identificador_unico: usuario.identificador_unico,
            email: usuario.email,
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            rol: usuario.rol.nombre_rol,
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
     * Registra un nuevo usuario
     */
    static async register(req, res, next) {
        try {
            const { nombres, apellidos, email, password, isTeacher } = req.body;

            // Validar que todos los campos requeridos estén presentes
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

            // Verificar si el email ya existe
            const existingUser = await Usuario.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Este correo ya está registrado',
                });
            }

            // Obtener el rol según isTeacher
            const roleName = isTeacher ? 'docente' : 'estudiante';
            const rol = await Rol.findOne({ where: { nombre_rol: roleName } });

            if (!rol) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al asignar rol',
                });
            }

            // Crear el usuario
            const usuario = await Usuario.create({
                nombres: String(nombres).trim(),
                apellidos: String(apellidos).trim(),
                email: String(email).toLowerCase().trim(),
                password_hash: password,
                rol_id: rol.id_rol,
                carrera_interes: null,
                primer_ingreso: true,
                activo: true,
            });

            // Cargar la relación del rol
            await usuario.reload({ include: [{ model: Rol, as: 'rol' }] });

            // Generar token
            const token = TokenService.generateToken({
                id: usuario.id_usuario,
                identificador_unico: usuario.identificador_unico,
                email: usuario.email,
                rol: usuario.rol.nombre_rol,
            });

            // Crear sesión
            const deviceInfo = {
                device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1] || 'Desconocido',
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent'],
            };

            await SessionService.createSession(usuario.id_usuario, deviceInfo, token);

            // Respuesta
            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                user: {
                    id: usuario.id_usuario.toString(),
                    identificador_unico: usuario.identificador_unico,
                    email: usuario.email,
                    nombres: usuario.nombres,
                    apellidos: usuario.apellidos,
                    rol: usuario.rol.nombre_rol,
                    carrera_interes: usuario.carrera_interes,
                    institucion: usuario.institucion,
                    bio: usuario.bio,
                    avatar: usuario.avatar,
                    fecha_registro: usuario.fecha_registro,
                    primer_ingreso: usuario.primer_ingreso,
                    activo: usuario.activo,
                },
                token,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/login
     * Inicia sesión de un usuario
     */
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const normalizedEmail = email.toLowerCase().trim();

            // Verificar intentos de login
            const attempts = await getLoginAttempts(normalizedEmail);
            if (attempts >= config.MAX_LOGIN_ATTEMPTS) {
                return res.status(429).json({
                    success: false,
                    message: 'Demasiados intentos fallidos. Intenta más tarde.',
                });
            }

            // Buscar usuario con rol
            const usuario = await Usuario.findOne({
                where: { email: normalizedEmail },
                include: [{ model: Rol, as: 'rol' }],
            });

            if (!usuario) {
                await setLoginAttempts(normalizedEmail, attempts + 1);
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado',
                });
            }

            // Verificar si está activo
            if (!usuario.activo) {
                return res.status(403).json({
                    success: false,
                    message: 'Cuenta desactivada. Contacta al administrador.',
                });
            }

            // Validar contraseña
            const isValidPassword = await usuario.validarPassword(password);
            if (!isValidPassword) {
                await setLoginAttempts(normalizedEmail, attempts + 1);

                // Registrar intento fallido
                await SessionService.logSessionHistory(
                    usuario.id_usuario,
                    {
                        device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1],
                        ip: req.ip || req.connection.remoteAddress,
                    },
                    'login',
                    false
                );

                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas',
                });
            }

            // Limpiar intentos fallidos
            await clearLoginAttempts(normalizedEmail);

            // Generar token
            const token = TokenService.generateToken({
                id: usuario.id_usuario,
                identificador_unico: usuario.identificador_unico,
                email: usuario.email,
                rol: usuario.rol.nombre_rol,
            });

            // Crear sesión
            const deviceInfo = {
                device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1] || 'Desconocido',
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent'],
            };

            await SessionService.createSession(usuario.id_usuario, deviceInfo, token);

            // Respuesta
            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                user: {
                    id: usuario.id_usuario.toString(),
                    identificador_unico: usuario.identificador_unico,
                    email: usuario.email,
                    nombres: usuario.nombres,
                    apellidos: usuario.apellidos,
                    rol: usuario.rol.nombre_rol,
                    carrera_interes: usuario.carrera_interes,
                    institucion: usuario.institucion,
                    bio: usuario.bio,
                    avatar: usuario.avatar,
                    fecha_registro: usuario.fecha_registro,
                    primer_ingreso: usuario.primer_ingreso,
                    activo: usuario.activo,
                },
                token,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/logout
     * Cierra la sesión actual
     */
    static async logout(req, res, next) {
        try {
            const token = req.token;

            // Revocar token
            await TokenService.revokeToken(token);

            // Desactivar sesión
            const deviceInfo = {
                device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1],
                ip: req.ip || req.connection.remoteAddress,
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

            // Generar nuevo token
            const newToken = TokenService.generateToken({
                id,
                identificador_unico,
                email,
                rol,
            });

            // Revocar el token antiguo
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
     * Verifica si el token es válido
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
                user: {
                    id: usuario.id_usuario.toString(),
                    identificador_unico: usuario.identificador_unico,
                    email: usuario.email,
                    nombres: usuario.nombres,
                    apellidos: usuario.apellidos,
                    rol: usuario.rol.nombre_rol,
                    carrera_interes: usuario.carrera_interes,
                    institucion: usuario.institucion,
                    bio: usuario.bio,
                    avatar: usuario.avatar,
                    fecha_registro: usuario.fecha_registro,
                    primer_ingreso: usuario.primer_ingreso,
                    activo: usuario.activo,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/quick-login
     * Login social simplificado para integracion local sin proveedor OAuth externo.
     */
    static async quickLogin(req, res, next) {
        try {
            const { email, nombres = 'Usuario', apellidos = 'PAE', provider = 'google', isTeacher = false } = req.body;

            if (!email) {
                return res.status(400).json({ success: false, message: 'Email requerido' });
            }

            const normalizedEmail = String(email).toLowerCase().trim();
            const roleName = isTeacher ? 'docente' : 'estudiante';
            const rol = await Rol.findOne({ where: { nombre_rol: roleName } });

            let usuario = await Usuario.findOne({
                where: { email: normalizedEmail },
                include: [{ model: Rol, as: 'rol' }],
            });

            if (!usuario) {
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
                ip: req.ip || req.connection.remoteAddress,
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
     * Entrega datos publicos minimos de un usuario autenticado.
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
                    email: usuario.email,
                    nombres: usuario.nombres,
                    apellidos: usuario.apellidos,
                    rol: usuario.rol.nombre_rol,
                    carrera_interes: usuario.carrera_interes,
                    institucion: usuario.institucion,
                    bio: usuario.bio,
                    avatar: usuario.avatar,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/auth/profile
     * Actualiza el perfil del usuario
     */
    static async updateProfile(req, res, next) {
        try {
            const { nombres, apellidos, institucion, bio } = req.body;
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

            // Actualizar campos
            await usuario.update({
                nombres: nombres?.trim() || usuario.nombres,
                apellidos: apellidos?.trim() || usuario.apellidos,
                institucion: institucion?.trim() || usuario.institucion,
                bio: bio?.trim() || usuario.bio,
            });

            res.status(200).json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                user: {
                    id: usuario.id_usuario.toString(),
                    identificador_unico: usuario.identificador_unico,
                    email: usuario.email,
                    nombres: usuario.nombres,
                    apellidos: usuario.apellidos,
                    rol: usuario.rol.nombre_rol,
                    carrera_interes: usuario.carrera_interes,
                    institucion: usuario.institucion,
                    bio: usuario.bio,
                    avatar: usuario.avatar,
                    fecha_registro: usuario.fecha_registro,
                    primer_ingreso: usuario.primer_ingreso,
                    activo: usuario.activo,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/auth/password
     * Cambia la contraseña del usuario (sin autenticación de contraseña actual)
     */
    static async updatePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;
            const token = req.token;

            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'La contrasena actual es requerida',
                });
            }

            if (!newPassword || newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva contrasena debe tener al menos 8 caracteres',
                });
            }

            const usuario = await Usuario.findByPk(userId);

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado',
                });
            }

            // Actualizar contraseña
            const isValidCurrentPassword = await usuario.validarPassword(currentPassword);
            if (!isValidCurrentPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'La contrasena actual no es correcta',
                });
            }

            await usuario.update({
                password_hash: newPassword,
            });

            // Registrar en historial
            await SessionService.logSessionHistory(
                userId,
                {
                    device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1],
                    ip: req.ip || req.connection.remoteAddress,
                },
                'cambio_password',
                true
            );

            // Revocar token actual y cerrar todas las sesiones
            await TokenService.revokeToken(token);
            await SessionService.deactivateAllUserSessions(
                userId,
                {
                    device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1],
                    ip: req.ip || req.connection.remoteAddress,
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

    static async logoutAll(req, res, next) {
        try {
            const sessions = await SessionService.getUserActiveSessions(req.user.id);
            await Promise.all(sessions.map((session) => TokenService.revokeToken(session.token_sesion)));
            await SessionService.deactivateAllUserSessions(req.user.id, {
                device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1],
                ip: req.ip || req.connection.remoteAddress,
            });

            res.status(200).json({ success: true, message: 'Todas las sesiones fueron cerradas' });
        } catch (error) {
            next(error);
        }
    }

    static async forgotPassword(req, res, next) {
        try {
            const email = String(req.body.email || '').toLowerCase().trim();
            const usuario = email ? await Usuario.findOne({ where: { email } }) : null;
            let resetToken = null;

            if (usuario) {
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

    static async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword || newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'Token y nueva contraseña validos son requeridos' });
            }

            const userId = await redis.get(`password_reset:${token}`);
            if (!userId) {
                return res.status(400).json({ success: false, message: 'Token expirado o invalido' });
            }

            const usuario = await Usuario.findByPk(userId);
            if (!usuario) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            await usuario.update({ password_hash: newPassword });
            await redis.del(`password_reset:${token}`);
            await SessionService.deactivateAllUserSessions(usuario.id_usuario, {
                device: req.headers['user-agent']?.match(/\(([^)]+)\)/)?.[1],
                ip: req.ip || req.connection.remoteAddress,
            });

            res.status(200).json({ success: true, message: 'Contraseña restablecida correctamente' });
        } catch (error) {
            next(error);
        }
    }

    static async requestTwoFactor(req, res, next) {
        try {
            const code = String(Math.floor(100000 + Math.random() * 900000));
            await redis.setex(`2fa:${req.user.id}`, 300, code);

            res.status(200).json({
                success: true,
                message: 'Codigo de verificacion generado',
                code: config.NODE_ENV === 'production' ? undefined : code,
            });
        } catch (error) {
            next(error);
        }
    }

    static async verifyTwoFactor(req, res, next) {
        try {
            const expectedCode = await redis.get(`2fa:${req.user.id}`);
            if (!expectedCode || expectedCode !== String(req.body.code || '').trim()) {
                return res.status(400).json({ success: false, message: 'Codigo invalido o expirado' });
            }

            await redis.del(`2fa:${req.user.id}`);
            res.status(200).json({ success: true, message: 'Verificacion completada' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;
