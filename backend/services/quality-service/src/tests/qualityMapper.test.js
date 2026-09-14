const {
    mapDashboard,
    normalizeGateStatus,
    toNumber,
    toRating,
} = require('../services/qualityMapper');

describe('qualityMapper', () => {
    test('normaliza valores numericos y ratings sin propagar NaN', () => {
        expect(toNumber('93.9')).toBe(93.9);
        expect(toNumber('invalido')).toBe(0);
        expect(toRating('1.0')).toBe('A');
        expect(toRating('5')).toBe('E');
        expect(toRating(null)).toBe('N/A');
    });

    test('normaliza los estados del Quality Gate', () => {
        expect(normalizeGateStatus('OK')).toBe('passed');
        expect(normalizeGateStatus('ERROR')).toBe('failed');
        expect(normalizeGateStatus('NONE')).toBe('unknown');
    });

    test('construye el contrato del dashboard sin exponer el token', () => {
        const dashboard = mapDashboard({
            measuresResponse: {
                component: {
                    key: 'pae-completo-local',
                    name: 'PAE',
                    measures: [
                        { metric: 'coverage', value: '93.9' },
                        { metric: 'tests', value: '53' },
                        { metric: 'test_failures', value: '0' },
                        { metric: 'duplicated_lines_density', value: '4.7' },
                        { metric: 'security_rating', value: '1.0' },
                    ],
                },
            },
            gateResponse: {
                projectStatus: {
                    status: 'OK',
                    conditions: [{
                        metricKey: 'coverage',
                        status: 'OK',
                        comparator: 'LT',
                        errorThreshold: '80',
                        actualValue: '93.9',
                    }],
                },
            },
            publicUrl: 'http://localhost:9010',
            generatedAt: '2026-07-21T16:00:00.000Z',
        });

        expect(dashboard.qualityGate.status).toBe('passed');
        expect(dashboard.metrics.coverage).toBe(93.9);
        expect(dashboard.metrics.tests).toBe(53);
        expect(dashboard.metrics.securityRating).toBe('A');
        expect(dashboard.links.dashboard).toContain('pae-completo-local');
        expect(JSON.stringify(dashboard)).not.toContain('token');
    });
});
