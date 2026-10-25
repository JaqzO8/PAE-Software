const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { searchPublicUsers } = require('../interfaces/http/publicUsers');
const PlatformController = require('../controllers/platformController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const {
    validateRegister,
    validateLogin,
    validateUpdatePassword,
    handleValidationErrors,
} = require('../utils/validators');

/**
 * POST /api/auth/register
 * Registro de nuevos usuarios (Siempre estudiante, sin autoasignación de rol docente)
 */
router.post(
    '/register',
    validateRegister,
    handleValidationErrors,
    AuthController.register
);

/**
 * POST /api/auth/login
 * Inicio de sesión con mitigación de enumeración y soporte para desafío MFA
 */
router.post(
    '/login',
    validateLogin,
    handleValidationErrors,
    AuthController.login
);

/**
 * POST /api/auth/mfa/complete
 * Completa la verificación de dos factores y emite la sesión definitiva
 */
router.post('/mfa/complete', AuthController.completeMfaLogin);

router.post('/quick-login', AuthController.quickLogin);

router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

/**
 * POST /api/auth/logout
 * Cierre de sesión (requiere autenticación)
 */
router.post(
    '/logout',
    verifyToken,
    AuthController.logout
);

/**
 * POST /api/auth/refresh
 * Refrescar token (requiere autenticación)
 */
router.post(
    '/refresh',
    verifyToken,
    AuthController.refreshToken
);

/**
 * GET /api/auth/verify
 * Verificar validez del token (requiere autenticación)
 */
router.get(
    '/verify',
    verifyToken,
    AuthController.verify
);

router.get('/users/search', verifyToken, searchPublicUsers);
router.put('/profile', verifyToken, AuthController.updateProfile);
router.put('/password', verifyToken, validateUpdatePassword, handleValidationErrors, AuthController.updatePassword);
router.get('/sessions', verifyToken, AuthController.getSessions);
router.post('/logout-all', verifyToken, AuthController.logoutAll);
router.post('/2fa/request', verifyToken, AuthController.requestTwoFactor);
router.post('/2fa/verify', verifyToken, AuthController.verifyTwoFactor);

// Habilitación y gestión de roles docentes (RIC-02, RIC-03, M1-S03)
router.post('/teacher/request', verifyToken, AuthController.requestTeacherRole);
router.get('/teacher/requests', verifyToken, verifyRole('admin'), AuthController.listTeacherRequests);
router.post('/teacher/requests/:id/approve', verifyToken, verifyRole('admin'), AuthController.approveTeacherRequest);
router.post('/teacher/requests/:id/reject', verifyToken, verifyRole('admin'), AuthController.rejectTeacherRequest);
router.post('/admin/assign-role', verifyToken, verifyRole('admin'), AuthController.assignRole);

// Preferencias de usuario, soporte y privacidad (M8)
router.get('/preferences', verifyToken, PlatformController.getPreferences);
router.put('/preferences', verifyToken, PlatformController.updatePreferences);
router.get('/support/tickets', verifyToken, PlatformController.listSupportTickets);
router.post('/support/tickets', verifyToken, PlatformController.createSupportTicket);
router.get('/privacy/export', verifyToken, PlatformController.exportPrivacyData);
router.post('/privacy/delete-request', verifyToken, PlatformController.requestAccountDeletion);

/**
 * GET /api/auth/user/:id
 * Datos públicos mínimos de usuario para otros servicios
 */
router.get(
    '/user/:id',
    verifyToken,
    AuthController.getUserById
);

/**
 * GET /api/auth/health
 * Health check del servicio
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'auth-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
