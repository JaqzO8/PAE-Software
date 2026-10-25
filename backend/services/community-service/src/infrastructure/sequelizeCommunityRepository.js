function createUnitOfWork({ sequelize, Comunidad, MiembroComunidad, InvitacionComunidad, MensajeCanal }) {
    const plain = (record) => record?.get({ plain: true }) || null;
    return (work) => sequelize.transaction(async (transaction) => {
        const save = async (Model, record, idKey, values) => {
            if (!record) return plain(await Model.create(values, { transaction }));
            await Model.update(values, { where: { [idKey]: record[idKey] }, transaction });
            return { ...record, ...values };
        };
        // All membership/invitation writes lock the community first, including absent members.
        return work({
            lockCommunity: async (id) => plain(await Comunidad.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE })),
            createCommunity: async (values) => plain(await Comunidad.create(values, { transaction })),
            createMessage: async (values) => plain(await MensajeCanal.create(values, { transaction })),
            findMessage: async (communityId, id) => plain(await MensajeCanal.findOne({ where: { comunidad_id: communityId, id_mensaje: id }, transaction })),
            findMessageRequest: async (communityId, userId, clientId) => plain(await MensajeCanal.findOne({ where: { comunidad_id: communityId, usuario_id: userId, client_id: clientId }, transaction })),
            saveMessage: (record, values) => save(MensajeCanal, record, 'id_mensaje', values),
            findMember: async (communityId, userId) => plain(await MiembroComunidad.findOne({ where: { comunidad_id: communityId, usuario_id: userId }, transaction })),
            findInvitation: async (id) => plain(await InvitacionComunidad.findByPk(id, { transaction })),
            findInvitationFor: async (communityId, studentId) => plain(await InvitacionComunidad.findOne({ where: { comunidad_id: communityId, estudiante_id: studentId }, order: [['id_invitacion', 'DESC']], transaction })),
            saveMember: (record, values) => save(MiembroComunidad, record, 'id_miembro', values),
            saveInvitation: (record, values) => save(InvitacionComunidad, record, 'id_invitacion', values),
            closeCommunity: async (id, now) => {
                await Comunidad.update({ activa: false, fecha_eliminacion: now }, { where: { id_comunidad: id }, transaction });
                await MiembroComunidad.update({ activo: false }, { where: { comunidad_id: id }, transaction });
                await InvitacionComunidad.update({ estado: 'expirada', fecha_respuesta: now }, { where: { comunidad_id: id, estado: 'pendiente' }, transaction });
            },
        });
    });
}
module.exports = { createUnitOfWork };
