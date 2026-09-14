const { sequelize } = require('../config/database');

const repairCommunityDatabase = async () => {
    await sequelize.query(`
        CREATE OR REPLACE FUNCTION actualizar_puntos_comunidad()
        RETURNS TRIGGER AS $$
        BEGIN
            IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'mensajes_canal' THEN
                UPDATE comunidades
                SET puntos_prestigio = puntos_prestigio + 1
                WHERE id_comunidad = NEW.comunidad_id;
                RETURN NEW;
            END IF;

            IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'recursos_comunidad' THEN
                UPDATE comunidades
                SET puntos_prestigio = puntos_prestigio + 5
                WHERE id_comunidad = NEW.comunidad_id;
                RETURN NEW;
            END IF;

            IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'desafios_semanales' THEN
                IF OLD.completado = FALSE AND NEW.completado = TRUE THEN
                    UPDATE comunidades
                    SET puntos_prestigio = puntos_prestigio + 10
                    WHERE id_comunidad = NEW.comunidad_id;
                END IF;
                RETURN NEW;
            END IF;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);
};

module.exports = { repairCommunityDatabase };
