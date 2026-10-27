function deviceName(userAgent, fallback = 'Desconocido') {
    if (typeof userAgent !== 'string') return fallback;
    const bounded = userAgent.slice(0, 512);
    const start = bounded.indexOf('(');
    const end = start < 0 ? -1 : bounded.indexOf(')', start + 1);
    return end > start + 1 ? bounded.slice(start + 1, end) : fallback;
}
module.exports = { deviceName };
