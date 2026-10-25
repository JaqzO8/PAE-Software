function createForumRepository(sequelize) {
    return { transaction: work => sequelize.transaction(async transaction => {
        const query = async (sql, replacements = {}) => (await sequelize.query(sql, { replacements, transaction }))[0];
        const one = async (sql, replacements) => (await query(sql, replacements))[0] || null;
        return work({
            lockGroup: id => one('SELECT * FROM comunidades WHERE id_comunidad=:id FOR UPDATE', { id }),
            member: (id, userId) => one('SELECT * FROM miembros_comunidad WHERE comunidad_id=:id AND usuario_id=:userId', { id, userId }),
            thread: (id, lock = false) => one(`SELECT * FROM forum_threads WHERE id=:id${lock ? ' FOR UPDATE' : ''}`, { id }),
            createThread: values => one('INSERT INTO forum_threads(community_id,author_id,title,body,tags) VALUES (:communityId,:userId,:title,:body,CAST(:tags AS jsonb)) RETURNING *', { ...values, tags: JSON.stringify(values.tags) }),
            comments: (id, after) => query('SELECT * FROM forum_comments WHERE thread_id=:id AND id>:after ORDER BY id LIMIT 51', { id, after }),
            comment: (commentId, id) => one('SELECT * FROM forum_comments WHERE id=:commentId AND thread_id=:id', { commentId, id }),
            removeComment: async (commentId, id, userId, reason) => {
                const changed = await one('UPDATE forum_comments SET removed_at=now() WHERE id=:commentId AND removed_at IS NULL RETURNING id', { commentId });
                if (changed) await query('INSERT INTO forum_audit(thread_id,actor_id,action,reason) VALUES (:id,:userId,:action,:reason)', { id, userId, action: `comment_removed:${commentId}`, reason });
            },
            commentRequest: (id, userId, clientId) => one('SELECT * FROM forum_comments WHERE thread_id=:id AND author_id=:userId AND client_id=:clientId', { id, userId, clientId }),
            createComment: (id, userId, body, clientId) => one('INSERT INTO forum_comments(thread_id,author_id,body,client_id) VALUES (:id,:userId,:body,:clientId) RETURNING *', { id, userId, body, clientId }),
            setLike: (id, userId, liked) => query(liked ? 'INSERT INTO forum_likes(thread_id,user_id) VALUES (:id,:userId) ON CONFLICT DO NOTHING' : 'DELETE FROM forum_likes WHERE thread_id=:id AND user_id=:userId', { id, userId }),
            report: (id, userId, reason) => one('INSERT INTO forum_reports(thread_id,reporter_id,reason) VALUES (:id,:userId,:reason) ON CONFLICT(thread_id,reporter_id) DO UPDATE SET reason=EXCLUDED.reason, status=\'pending\', resolution=NULL, resolved_at=NULL, resolved_by=NULL RETURNING id,status', { id, userId, reason }),
            reports: id => query('SELECT id,reason,status,resolution,created_at,resolved_at FROM forum_reports WHERE thread_id=:id ORDER BY id DESC LIMIT 100', { id }),
            resolveReport: (id, reportId, userId, resolution) => one("UPDATE forum_reports SET status='resolved', resolution=:resolution, resolved_by=:userId, resolved_at=now() WHERE thread_id=:id AND id=:reportId RETURNING id,status,resolution", { id, reportId, userId, resolution }),
            update: async (thread, userId, action, reason, fields) => {
                const changes = { edit: 'title=:title,body=:body', resolve: 'resolved=true', reopen: 'resolved=false', remove: 'removed_at=now()', restore: 'removed_at=NULL' }[action];
                const updated = await one(`UPDATE forum_threads SET ${changes},version=version+1,updated_at=now() WHERE id=:id RETURNING *`, { id: thread.id, ...fields });
                await query('INSERT INTO forum_audit(thread_id,actor_id,action,reason) VALUES (:id,:userId,:action,:reason)', { id: thread.id, userId, action, reason });
                return updated;
            },
        });
    }) };
}
module.exports = { createForumRepository };
