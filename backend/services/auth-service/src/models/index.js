const Rol = require('./Rol');
const Usuario = require('./Usuario');
const Sesion = require('./Sesion');
const HistorialSesion = require('./HistorialSesion');
const UserPreference = require('./UserPreference');
const SupportTicket = require('./SupportTicket');

// Función para inicializar roles por defecto
const initializeRoles = async () => {
    try {
        const roles = [
            { nombre_rol: 'estudiante', descripcion: 'Usuario estudiante con acceso a contenido educativo' },
            { nombre_rol: 'docente', descripcion: 'Usuario docente con permisos para crear y gestionar contenido' },
            { nombre_rol: 'admin', descripcion: 'Administrador con acceso completo al sistema' },
        ];

        for (const rolData of roles) {
            await Rol.findOrCreate({
                where: { nombre_rol: rolData.nombre_rol },
                defaults: rolData,
            });
        }
        console.log('✅ Roles inicializados correctamente');
    } catch (error) {
        console.error('❌ Error inicializando roles:', error.message);
    }
};

module.exports = {
    Rol,
    Usuario,
    Sesion,
    HistorialSesion,
    UserPreference,
    SupportTicket,
    initializeRoles,
};
