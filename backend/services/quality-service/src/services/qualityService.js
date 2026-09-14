const config = require('../config/env');
const { SonarQubeClient } = require('./sonarQubeClient');
const { mapDashboard } = require('./qualityMapper');

const client = new SonarQubeClient({
    baseUrl: config.SONARQUBE_URL,
    token: config.SONAR_TOKEN,
    projectKey: config.SONAR_PROJECT_KEY,
    timeoutMs: config.REQUEST_TIMEOUT_MS,
});

let cachedDashboard = null;
let cacheExpiresAt = 0;
let pendingRequest = null;

const loadDashboard = async () => {
    const [measuresResponse, gateResponse] = await Promise.all([
        client.getMeasures(),
        client.getQualityGate(),
    ]);
    const generatedAt = new Date().toISOString();

    cachedDashboard = mapDashboard({
        measuresResponse,
        gateResponse,
        publicUrl: config.SONARQUBE_PUBLIC_URL,
        generatedAt,
    });
    cacheExpiresAt = Date.now() + (config.CACHE_TTL_SECONDS * 1000);
    return cachedDashboard;
};

const getDashboard = async ({ refresh = false } = {}) => {
    if (!refresh && cachedDashboard && Date.now() < cacheExpiresAt) {
        return { dashboard: cachedDashboard, cached: true };
    }

    if (!pendingRequest) {
        pendingRequest = loadDashboard().finally(() => {
            pendingRequest = null;
        });
    }

    const dashboard = await pendingRequest;
    return { dashboard, cached: false };
};

module.exports = { getDashboard };
