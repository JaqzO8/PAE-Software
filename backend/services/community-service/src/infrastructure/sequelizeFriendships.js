const { Op } = require('sequelize');
function createFriendshipsRepository({ sequelize, Amistad }) {
    const plain = item => item?.get({ plain: true }) || null;
    return {
        findReference: async id => plain(await Amistad.findByPk(id)),
        withPair: (from, to, work) => sequelize.transaction(async transaction => {
            const pair = [Number(from), Number(to)].sort((a, b) => a - b);
            await sequelize.query("SELECT pg_advisory_xact_lock(hashtextextended(:pair, 0))", { replacements: { pair: `friendship:${pair.join(':')}` }, transaction });
            return work({
                current: async () => plain(await Amistad.findOne({ where: {
                    [Op.or]: [{ usuario_solicitante_id: from, usuario_receptor_id: to }, { usuario_solicitante_id: to, usuario_receptor_id: from }],
                    estado: { [Op.in]: ['pendiente', 'aceptada', 'bloqueada'] },
                }, transaction })),
                create: async values => plain(await Amistad.create(values, { transaction })),
                get: async id => plain(await Amistad.findByPk(id, { transaction })),
                save: async (item, values) => { await Amistad.update(values, { where: { id_amistad: item.id_amistad }, transaction }); return { ...item, ...values }; },
            });
        }),
    };
}
module.exports = { createFriendshipsRepository };
