function createDailyMission({ userId, date, lessonIds = [], questionCount = 5 }) {
    if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) throw new Error('INVALID_USER');
    const day = String(date).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('INVALID_DATE');
    const ids = [...new Set(lessonIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 20);
    if (!ids.length) throw new Error('MISSION_WITHOUT_CONTENT');
    const count = Math.max(1, Math.min(20, Number(questionCount) || 5));
    return {
        id: `mission-${userId}-${day}`,
        userId: Number(userId), date: day, lessonIds: ids, questionCount: count,
        status: 'pending', completedAt: null,
    };
}

function completeDailyMission(mission, { userId, idempotencyKey }) {
    if (!mission || Number(mission.userId) !== Number(userId)) throw new Error('FORBIDDEN_MISSION');
    if (!idempotencyKey || String(idempotencyKey) !== mission.id) throw new Error('INVALID_MISSION_KEY');
    if (mission.status === 'completed') return { ...mission, replayed: true };
    return { ...mission, status: 'completed', completedAt: new Date().toISOString(), replayed: false };
}

module.exports = { createDailyMission, completeDailyMission };
