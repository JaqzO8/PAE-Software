const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { fail } = require('../domain/communityPolicy');
async function verifySession(token) {
    let decoded;
    try { decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { fail('SESSION_INVALID', 'La sesión no es válida o ha expirado', 401); }
    try {
        const { data } = await axios.get(`${config.AUTH_SERVICE_URL}/api/auth/verify`, { headers: { Authorization: `Bearer ${token}` }, timeout: 2500 });
        if (data.valid !== true || !data.user || data.user.activo === false || String(data.user.id) !== String(decoded.id)) fail('SESSION_INVALID', 'La sesión ya no está activa', 401);
        return { id: data.user.id, rol: data.user.rol, nombres: data.user.nombres, apellidos: data.user.apellidos, avatar: data.user.avatar, exp: decoded.exp };
    } catch (error) {
        if (error.code === 'SESSION_INVALID') throw error;
        if ([401, 403, 404].includes(error.response?.status)) fail('SESSION_INVALID', 'La sesión ya no está activa', 401);
        fail('IDENTITY_UNAVAILABLE', 'No se pudo comprobar la sesión; inténtalo nuevamente', 503);
    }
}
module.exports = { verifySession };
