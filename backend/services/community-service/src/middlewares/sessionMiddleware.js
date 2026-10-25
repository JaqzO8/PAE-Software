const { verifySession } = require('../infrastructure/sessionAuthority');
async function verifyToken(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (typeof header !== 'string' || !header.startsWith('Bearer ')) return res.status(401).json({ success: false, code: 'SESSION_REQUIRED', message: 'Token no proporcionado' });
        req.token = header.substring(7);
        req.user = await verifySession(req.token);
        next();
    } catch (error) { next(error); }
}
module.exports = { verifyToken };
