const Comunidad = require('./Comunidad');
const MiembroComunidad = require('./MiembroComunidad');
const MensajeCanal = require('./MensajeCanal');
const RecursoComunidad = require('./RecursoComunidad');
const DesafioSemanal = require('./DesafioSemanal');
const InvitacionComunidad = require('./InvitacionComunidad');
const Amistad = require('./Amistad');
const ReporteComunidad = require('./ReporteComunidad');
const CommunitySetting = require('./CommunitySetting');
const WellbeingContent = require('./WellbeingContent');
const UniversityNews = require('./UniversityNews');

// Relaciones
Comunidad.hasMany(MiembroComunidad, { foreignKey: 'comunidad_id', as: 'miembros' });
MiembroComunidad.belongsTo(Comunidad, { foreignKey: 'comunidad_id', as: 'comunidad' });

Comunidad.hasMany(MensajeCanal, { foreignKey: 'comunidad_id', as: 'mensajes' });
MensajeCanal.belongsTo(Comunidad, { foreignKey: 'comunidad_id', as: 'comunidad' });

Comunidad.hasMany(RecursoComunidad, { foreignKey: 'comunidad_id', as: 'recursos' });
RecursoComunidad.belongsTo(Comunidad, { foreignKey: 'comunidad_id', as: 'comunidad' });

Comunidad.hasMany(DesafioSemanal, { foreignKey: 'comunidad_id', as: 'desafios' });
DesafioSemanal.belongsTo(Comunidad, { foreignKey: 'comunidad_id', as: 'comunidad' });

Comunidad.hasMany(InvitacionComunidad, { foreignKey: 'comunidad_id', as: 'invitaciones' });
InvitacionComunidad.belongsTo(Comunidad, { foreignKey: 'comunidad_id', as: 'comunidad' });

Comunidad.hasMany(ReporteComunidad, { foreignKey: 'comunidad_id', as: 'reportes' });
ReporteComunidad.belongsTo(Comunidad, { foreignKey: 'comunidad_id', as: 'comunidad' });

module.exports = {
    Comunidad,
    MiembroComunidad,
    MensajeCanal,
    RecursoComunidad,
    DesafioSemanal,
    InvitacionComunidad,
    Amistad,
    ReporteComunidad,
    CommunitySetting,
    WellbeingContent,
    UniversityNews,
};
