const { createHash, randomUUID } = require('node:crypto');
const digest = (values) => createHash('sha256').update(JSON.stringify(values)).digest('hex');

function createPostgresAwards({ pool }) {
    return {
        async grantOnce({ event, award }) {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                // Fields are canonicalized explicitly; JSON key ordering cannot alter identity.
                const fingerprint = digest([event.type, event.schemaVersion, event.producer, event.occurredAt, event.correlationId, event.data.attemptId, event.data.userId, event.data.resultVersion, event.data.status]);
                const ruleHash = digest([award.ruleId, award.ruleVersion, award.points]);
                await client.query('INSERT INTO gamification.rules (rule_id, version, fingerprint) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [award.ruleId, award.ruleVersion, ruleHash]);
                const rule = await client.query('SELECT fingerprint FROM gamification.rules WHERE rule_id=$1 AND version=$2', [award.ruleId, award.ruleVersion]);
                if (rule.rows[0].fingerprint !== ruleHash) throw new Error('Rule version is immutable');
                await client.query('INSERT INTO gamification.inbox (event_id, fingerprint) VALUES ($1,$2) ON CONFLICT DO NOTHING', [event.eventId, fingerprint]);
                const stored = await client.query('SELECT fingerprint FROM gamification.inbox WHERE event_id=$1', [event.eventId]);
                if (stored.rows[0].fingerprint !== fingerprint) throw new Error('Event identity reused with different content');
                const inserted = await client.query(`INSERT INTO gamification.ledger
                    (event_id, user_id, source_type, source_id, rule_id, rule_version, points)
                    VALUES ($1,$2,$3,$4,$5,$6,$7)
                    ON CONFLICT (source_type, source_id, user_id, rule_id, rule_version) DO NOTHING RETURNING id`,
                [event.eventId, award.userId, award.sourceType, award.sourceId, award.ruleId, award.ruleVersion, award.points]);
                if (inserted.rowCount) {
                    await client.query(`INSERT INTO gamification.balances (user_id, points) VALUES ($1,$2)
                        ON CONFLICT (user_id) DO UPDATE SET points=gamification.balances.points+EXCLUDED.points`, [award.userId, award.points]);
                    const outgoing = {
                        eventId: randomUUID(), type: 'PuntosOtorgados.v1', schemaVersion: 1, producer: 'learning',
                        occurredAt: new Date().toISOString(), correlationId: event.correlationId,
                        data: { userId: award.userId, sourceEventId: event.eventId, ruleId: award.ruleId, ruleVersion: award.ruleVersion, points: award.points },
                    };
                    await client.query('INSERT INTO gamification.outbox (event_id, payload) VALUES ($1,$2)', [outgoing.eventId, outgoing]);
                }
                await client.query('COMMIT');
                return { granted: inserted.rowCount === 1 };
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally { client.release(); }
        },
    };
}
module.exports = { createPostgresAwards };
