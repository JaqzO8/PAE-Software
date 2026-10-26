function createPostgresPlanningRepository(client) {
    return {
        async findOrCreatePreferences(userId, defaults) {
            const result = await client.query(`
                INSERT INTO planning.preferences (user_id, preferred_days, start_time, end_time, subjects, reminders_enabled, time_zone)
                VALUES ($1,$2,$3,$4,$5,$6,$7)
                ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
                RETURNING *`, [userId, defaults.dias_preferidos, defaults.hora_inicio, defaults.hora_fin, defaults.materias, defaults.recordatorios_activos, defaults.zona_horaria]);
            return toPreference(result.rows[0]);
        },
        async savePreferences(userId, data) {
            const result = await client.query(`
                INSERT INTO planning.preferences (user_id, preferred_days, start_time, end_time, subjects, reminders_enabled, time_zone)
                VALUES ($1,$2,$3,$4,$5,$6,$7)
                ON CONFLICT (user_id) DO UPDATE SET preferred_days=EXCLUDED.preferred_days,start_time=EXCLUDED.start_time,end_time=EXCLUDED.end_time,subjects=EXCLUDED.subjects,reminders_enabled=EXCLUDED.reminders_enabled,time_zone=EXCLUDED.time_zone,updated_at=now()
                RETURNING *`, [userId, data.dias_preferidos, data.hora_inicio, data.hora_fin, data.materias, data.recordatorios_activos, data.zona_horaria]);
            return toPreference(result.rows[0]);
        },
        async findUpcomingReminders(userId, now) {
            const result = await client.query(`SELECT * FROM planning.reminders WHERE user_id=$1 AND status='pending' AND scheduled_at >= $2 ORDER BY scheduled_at ASC`, [userId, now]);
            return result.rows.map(toReminder);
        },
        async findCompletedSessionsCount(userId) {
            const result = await client.query(`SELECT count(*)::int AS count FROM planning.reminders WHERE user_id=$1 AND status='sent'`, [userId]);
            return result.rows[0].count;
        },
        async cancelPendingReminders(userId) {
            await client.query(`UPDATE planning.reminders SET status='cancelled' WHERE user_id=$1 AND status='pending'`, [userId]);
        },
        async createReminder(data) {
            try {
                const result = await client.query(`INSERT INTO planning.reminders(user_id,title,subject,scheduled_at,duration_minutes,status,origin) VALUES($1,$2,$3,$4,$5,'pending',$6) RETURNING *`, [data.id_usuario, data.titulo, data.materia, data.programado_para, data.duracion_minutos, data.origen]);
                return toReminder(result.rows[0]);
            } catch (error) {
                if (error.code !== '23505') throw error;
                const existing = await client.query('SELECT * FROM planning.reminders WHERE user_id=$1 AND scheduled_at=$2 AND title=$3', [data.id_usuario, data.programado_para, data.titulo]);
                if (!existing.rows[0]) throw error;
                return toReminder(existing.rows[0]);
            }
        },
        async findReminder(id) {
            const result = await client.query('SELECT * FROM planning.reminders WHERE id=$1', [id]);
            return result.rows[0] ? toReminder(result.rows[0]) : null;
        },
        async updateReminderStatus(id, status, metadata = {}) {
            const result = await client.query(`UPDATE planning.reminders SET status=$2,worker_id=COALESCE($3,worker_id),claimed_at=COALESCE($4,claimed_at),delivered_at=COALESCE($5,delivered_at),delivery_error=$6 WHERE id=$1 RETURNING *`, [id, mapStatus(status), metadata.reclamado_por || null, metadata.reclamado_en || null, metadata.fecha_entrega || null, metadata.error_entrega || null]);
            return result.rows[0] ? toReminder(result.rows[0]) : null;
        },
        async findReminderForUpdate(id) {
            const result = await client.query('SELECT * FROM planning.reminders WHERE id=$1 FOR UPDATE', [id]);
            return result.rows[0] ? toReminder(result.rows[0]) : null;
        },
        async recordLessonCompletionProjection() { return { recorded: true }; },
        async saveDailyMission(mission) {
            const result = await client.query(`INSERT INTO planning.missions(mission_id,user_id,mission_date,lesson_ids,question_count,status) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(user_id,mission_date) DO UPDATE SET lesson_ids=EXCLUDED.lesson_ids,question_count=EXCLUDED.question_count RETURNING *`, [mission.id, mission.userId, mission.date, mission.lessonIds, mission.questionCount, mission.status]);
            return toMission(result.rows[0]);
        },
        async findDailyMission(id) {
            const result = await client.query('SELECT * FROM planning.missions WHERE mission_id=$1', [id]);
            return result.rows[0] ? toMission(result.rows[0]) : null;
        },
        async completeDailyMission(id, completedAt) {
            const result = await client.query(`UPDATE planning.missions SET status='completed',completed_at=$2 WHERE mission_id=$1 RETURNING *`, [id, completedAt]);
            return result.rows[0] ? toMission(result.rows[0]) : null;
        },
        async recordPomodoroTransition(data) {
            await client.query(`INSERT INTO planning.pomodoro_sessions(user_id, previous_state, current_state, action, seconds_elapsed, occurred_at) VALUES($1,$2,$3,$4,$5,$6)`, [data.userId, data.previousState, data.currentState, data.action, data.secondsElapsed, data.occurredAt]);
        },
    };
}

const mapStatus = (status) => ({ pendiente: 'pending', reclamado: 'claimed', enviado: 'sent', fallido: 'failed', cancelado: 'cancelled' }[status] || status);
const toPreference = (row) => row && ({ dias_preferidos: row.preferred_days, hora_inicio: row.start_time, hora_fin: row.end_time, materias: row.subjects, recordatorios_activos: row.reminders_enabled, zona_horaria: row.time_zone });
const toReminder = (row) => ({ id_recordatorio: row.id, id_usuario: row.user_id, titulo: row.title, materia: row.subject, programado_para: row.scheduled_at, duracion_minutos: row.duration_minutes, estado: ({ pending: 'pendiente', claimed: 'reclamado', sent: 'enviado', failed: 'fallido', cancelled: 'cancelado' }[row.status] || row.status), origen: row.origin });
const toMission = (row) => ({ id: row.mission_id, userId: Number(row.user_id), date: String(row.mission_date).slice(0, 10), lessonIds: row.lesson_ids, questionCount: row.question_count, status: row.status, completedAt: row.completed_at });

module.exports = { createPostgresPlanningRepository };
