const { Op } = require('sequelize');
const { Usuario, Rol } = require('../../models');

async function searchPublicUsers(req, res, next) {
    try {
        const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
        if (query.length < 2 || query.length > 100) return res.status(400).json({ success: false, message: 'Busca entre 2 y 100 caracteres' });
        const term = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
        const users = await Usuario.findAll({
            where: { activo: true, [Op.or]: [
                { nombres: { [Op.iLike]: term } }, { apellidos: { [Op.iLike]: term } },
                { identificador_unico: { [Op.iLike]: term } },
            ] },
            attributes: ['id_usuario', 'identificador_unico', 'nombres', 'apellidos', 'avatar'],
            include: [{ model: Rol, as: 'rol', attributes: ['nombre_rol'] }],
            order: [['nombres', 'ASC'], ['id_usuario', 'ASC']], limit: 25,
        });
        res.json({ success: true, users: users.map(user => ({
            id: String(user.id_usuario), identificador_unico: user.identificador_unico,
            nombres: user.nombres, apellidos: user.apellidos, avatar: user.avatar, rol: user.rol.nombre_rol,
        })) });
    } catch (error) { next(error); }
}
module.exports = { searchPublicUsers };
