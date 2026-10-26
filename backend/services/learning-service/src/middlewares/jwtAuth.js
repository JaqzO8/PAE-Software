const crypto = require('node:crypto');

function authenticate(req, res, next) {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const secret = process.env.JWT_SECRET;
    if (!token || !secret) return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    try {
        const [encodedHeader, encodedPayload, signature] = token.split('.');
        const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
        if (header.alg !== 'HS256' || header.typ !== 'JWT') throw new Error('algorithm');
        const expected = crypto.createHmac('sha256', secret).update(`${encodedHeader}.${encodedPayload}`).digest('base64url');
        if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('signature');
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('expired');
        if (payload.scope === 'mfa_challenge') throw new Error('scope');
        if (!payload.id && !payload.userId && !payload.id_usuario) throw new Error('subject');
        req.user = { id: Number(payload.id || payload.userId || payload.id_usuario), rol: payload.rol };
        return next();
    } catch {
        return res.status(401).json({ success: false, message: 'Token inválido' });
    }
}

module.exports = { authenticate };
