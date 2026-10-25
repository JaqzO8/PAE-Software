const { Op } = require('sequelize');
const axios = require('axios');
const { Amistad } = require('../models');
const { sequelize } = require('../config/database');
const config = require('../config/env');
const { positiveId, fail } = require('../domain/communityPolicy');
const { findUser } = require('../infrastructure/identityDirectory');
const { createFriendshipsRepository } = require('../infrastructure/sequelizeFriendships');
const { createFriendshipUseCases } = require('../application/friendshipUseCases');
const useCases = createFriendshipUseCases({ ...createFriendshipsRepository({ sequelize, Amistad }), findUser, clock: { now: () => new Date() } });
class FriendshipController {
    static async sendRequest(req, res, next) {
        try { res.status(201).json({ success: true, friendship: await useCases.request({ actor: req.user, recipientId: req.body.usuario_receptor_id, accessToken: req.token }) }); }
        catch (error) { next(error); }
    }
    static async respond(req, res, next) {
        try { res.json({ success: true, friendship: await useCases.respond({ actor: req.user, friendshipId: req.params.friendshipId, action: req.params.action }) }); }
        catch (error) { next(error); }
    }
    static async list(req, res, next) {
        try {
            const userId = positiveId(req.user.id);
            const where = { [Op.or]: [{ usuario_solicitante_id: userId }, { usuario_receptor_id: userId }], estado: { [Op.in]: ['aceptada', 'pendiente'] } };
            if (req.query.before) where.id_amistad = { [Op.lt]: positiveId(req.query.before) };
            const items = await Amistad.findAll({ where, order: [['id_amistad', 'DESC']], limit: 51 });
            const page = items.slice(0, 50);
            const people = new Map();
            await Promise.all([...new Set(page.map(item => Number(item.usuario_solicitante_id) === userId ? item.usuario_receptor_id : item.usuario_solicitante_id))].map(async id => {
                try { people.set(Number(id), await findUser(id, req.token)); } catch { /* The relation remains accessible when the profile is unavailable. */ }
            }));
            const records = page.map(item => {
                const outgoing = Number(item.usuario_solicitante_id) === userId;
                const peerId = outgoing ? item.usuario_receptor_id : item.usuario_solicitante_id;
                const peer = people.get(Number(peerId));
                return { ...item.get({ plain: true }), direction: outgoing ? 'outgoing' : 'incoming', peer: { id: peerId, nombres: peer?.nombres || 'Usuario', apellidos: peer?.apellidos || '', avatar: peer?.avatar || null } };
            });
            res.json({ success: true, friends: records.filter(item => item.estado === 'aceptada'), requests: records.filter(item => item.estado === 'pendiente'), nextCursor: items.length > 50 ? String(page.at(-1).id_amistad) : null });
        } catch (error) { next(error); }
    }
    static async searchUsers(req, res, next) {
        try {
            const { query } = req.query;
            if (typeof query !== 'string' || query.trim().length < 2 || query.length > 100) fail('INVALID_QUERY', 'Busca entre 2 y 100 caracteres');
            const response = await axios.get(`${config.AUTH_SERVICE_URL}/api/auth/users/search`, { params: { query: query.trim() }, headers: { Authorization: `Bearer ${req.token}` }, timeout: 2500 });
            res.json({ success: true, users: response.data.users });
        } catch (error) {
            if (error.isAxiosError) { error.status = [401, 403].includes(error.response?.status) ? 401 : 503; error.message = 'No se pudo consultar Identidad'; }
            next(error);
        }
    }
}
module.exports = FriendshipController;
