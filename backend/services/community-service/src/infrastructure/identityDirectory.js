const axios = require('axios');
const config = require('../config/env');
const { fail } = require('../domain/communityPolicy');

async function findStudent(userId, accessToken) {
    try {
        const response = await axios.get(`${config.AUTH_SERVICE_URL}/api/auth/user/${userId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }, timeout: 2500,
        });
        const user = response.data.user;
        if (!user || String(user.id) !== String(userId) || user.rol !== 'estudiante') {
            fail('STUDENT_REQUIRED', 'El destinatario debe ser un estudiante activo', 400);
        }
    } catch (error) {
        if (error.code === 'STUDENT_REQUIRED') throw error;
        if (error.response?.status === 404) fail('STUDENT_NOT_FOUND', 'Estudiante no encontrado', 404);
        if ([401, 403].includes(error.response?.status)) fail('SESSION_INVALID', 'La sesión no está autorizada', 401);
        fail('IDENTITY_UNAVAILABLE', 'No se pudo verificar al estudiante. Intenta nuevamente', 503);
    }
}
module.exports = { findStudent };
