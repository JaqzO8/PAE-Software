const METRIC_KEYS = [
    'coverage',
    'line_coverage',
    'branch_coverage',
    'duplicated_lines_density',
    'duplicated_lines',
    'ncloc',
    'tests',
    'test_errors',
    'test_failures',
    'test_success_density',
    'vulnerabilities',
    'security_rating',
    'bugs',
    'reliability_rating',
    'code_smells',
    'sqale_rating',
    'security_hotspots',
    'security_review_rating',
    'software_quality_security_issues',
    'software_quality_reliability_issues',
    'software_quality_maintainability_issues',
].join(',');

class SonarQubeClient {
    constructor({ baseUrl, token, projectKey, timeoutMs, fetchImpl = fetch }) {
        this.baseUrl = baseUrl;
        this.token = token;
        this.projectKey = projectKey;
        this.timeoutMs = timeoutMs;
        this.fetchImpl = fetchImpl;
    }

    async request(path, parameters) {
        const url = new URL(path, `${this.baseUrl}/`);
        Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value));

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await this.fetchImpl(url, {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Basic ${Buffer.from(`${this.token}:`).toString('base64')}`,
                },
                signal: controller.signal,
            });

            if (!response.ok) {
                const error = new Error(`SonarQube respondio con estado ${response.status}`);
                error.statusCode = response.status;
                throw error;
            }

            return response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                const timeoutError = new Error('SonarQube excedio el tiempo de respuesta');
                timeoutError.statusCode = 504;
                throw timeoutError;
            }
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    getMeasures() {
        return this.request('/api/measures/component', {
            component: this.projectKey,
            metricKeys: METRIC_KEYS,
        });
    }

    getQualityGate() {
        return this.request('/api/qualitygates/project_status', {
            projectKey: this.projectKey,
        });
    }
}

module.exports = { SonarQubeClient, METRIC_KEYS };
