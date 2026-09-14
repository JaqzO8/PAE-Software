const { Amistad } = require('../models');
const axios = require('axios');
const config = require('../config/env');

class FriendshipController {
    // POST /api/friends/request - Enviar solicitud
    static async sendRequest(req, res, next) {
        try {
            const { usuario_receptor_id } = req.body;
            const userId = req.user.id;

            if (userId === usuario_receptor_id) {
                return res.status(400).json({ success: false, message: 'No puedes agregarte a ti mismo' });
            }

            const existing = await Amistad.findOne({
                where: {
                    usuario_solicitante_id: userId,
                    usuario_receptor_id,
                },
            });

            if (existing) {
                return res.status(400).json({ success: false, message: 'Ya existe una solicitud' });
            }

            const friendship = await Amistad.create({
                usuario_solicitante_id: userId,
                usuario_receptor_id,
                estado: 'pendiente',
            });

            res.status(201).json({ success: true, friendship });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/friends - Listar amigos
    static async list(req, res, next) {
        try {
            const userId = req.user.id;

            const friendships = await Amistad.findAll({
                where: {
                    [Op.or]: [
                        { usuario_solicitante_id: userId, estado: 'aceptada' },
                        { usuario_receptor_id: userId, estado: 'aceptada' },
                    ],
                },
            });

            res.status(200).json({ success: true, friends: friendships });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/users/search - Buscar usuarios por nombre o identificador
    static async searchUsers(req, res, next) {
        try {
            const { query } = req.query;

            if (!query || query.length < 2) {
                return res.status(400).json({ success: false, message: 'Query muy corto' });
            }

            // Llamar a auth-service para buscar usuarios
            const response = await axios.get(
                `${config.AUTH_SERVICE_URL}/api/auth/users/search?query=${query}`,
                { headers: { Authorization: `Bearer ${req.token}` } }
            );

            res.status(200).json({ success: true, users: response.data.users });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = FriendshipController;