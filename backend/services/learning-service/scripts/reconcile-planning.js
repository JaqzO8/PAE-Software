const { Pool } = require('pg');

const apply = process.argv.includes('--apply');
const sourceUrl = process.env.CONTENT_DATABASE_URL;
const targetUrl = process.env.LEARNING_DATABASE_URL;

if (!sourceUrl || !targetUrl) {
    console.error('Define CONTENT_DATABASE_URL y LEARNING_DATABASE_URL para reconciliar planificación.');
    process.exitCode = 1;
} else {
    const source = new Pool({ connectionString: sourceUrl });
    const target = new Pool({ connectionString: targetUrl });
    (async () => {
        const [preferences, reminders] = await Promise.all([
            source.query('SELECT id_usuario, dias_preferidos, hora_inicio, hora_fin, materias, recordatorios_activos, zona_horaria FROM study_preferences ORDER BY id_usuario'),
            source.query("SELECT id_usuario, titulo, materia, programado_para, duracion_minutos, estado, origen FROM study_reminders WHERE estado IN ('pendiente','completado','omitido') ORDER BY id_usuario, programado_para"),
        ]);
        const report = { sourcePreferences: preferences.rowCount, sourceReminders: reminders.rowCount, applied: apply, preferenceRows: 0, reminderRows: 0 };
        const client = await target.connect();
        try {
            await client.query('BEGIN');
            for (const row of preferences.rows) {
                if (apply) await client.query(`INSERT INTO planning.preferences(user_id,preferred_days,start_time,end_time,subjects,reminders_enabled,time_zone)
                    VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(user_id) DO UPDATE SET preferred_days=EXCLUDED.preferred_days,start_time=EXCLUDED.start_time,end_time=EXCLUDED.end_time,subjects=EXCLUDED.subjects,reminders_enabled=EXCLUDED.reminders_enabled,time_zone=EXCLUDED.time_zone,updated_at=now()`,
                [row.id_usuario, row.dias_preferidos, row.hora_inicio, row.hora_fin, row.materias, row.recordatorios_activos, row.zona_horaria || 'America/Lima']);
                report.preferenceRows += 1;
            }
            for (const row of reminders.rows) {
                if (apply) await client.query(`INSERT INTO planning.reminders(user_id,title,subject,scheduled_at,duration_minutes,status,origin)
                    VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(user_id,scheduled_at,title) DO UPDATE SET subject=EXCLUDED.subject,duration_minutes=EXCLUDED.duration_minutes,status=EXCLUDED.status,origin=EXCLUDED.origin`,
                [row.id_usuario, row.titulo, row.materia, row.programado_para, row.duracion_minutos, mapStatus(row.estado), row.origen || 'migrated']);
                report.reminderRows += 1;
            }
            if (apply) await client.query('COMMIT'); else await client.query('ROLLBACK');
            console.log(JSON.stringify(report, null, 2));
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(error.message);
            process.exitCode = 1;
        } finally {
            client.release();
            await Promise.all([source.end(), target.end()]);
        }
    })().catch(async (error) => {
        console.error(error.message);
        await Promise.all([source.end(), target.end()]);
        process.exitCode = 1;
    });
}

function mapStatus(status) {
    return { pendiente: 'pending', completado: 'sent', omitido: 'cancelled' }[status] || 'pending';
}
