const { SonarQubeClient } = require('../services/sonarQubeClient');

const createClient = (fetchImpl) => new SonarQubeClient({
    baseUrl: 'http://sonarqube.test',
    token: 'test-token',
    projectKey: 'pae-test',
    timeoutMs: 1000,
    fetchImpl,
});

describe('SonarQubeClient', () => {
    test('consulta las metricas con autenticacion Basic y el proyecto configurado', async () => {
        const fetchImpl = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ component: { key: 'pae-test', measures: [] } }),
        });
        const client = createClient(fetchImpl);

        const response = await client.getMeasures();

        expect(response.component.key).toBe('pae-test');
        expect(fetchImpl).toHaveBeenCalledTimes(1);
        const [url, options] = fetchImpl.mock.calls[0];
        expect(url.searchParams.get('component')).toBe('pae-test');
        expect(url.searchParams.get('metricKeys')).toContain('coverage');
        expect(options.headers.Authorization).toBe(
            `Basic ${Buffer.from('test-token:').toString('base64')}`,
        );
    });

    test('consulta el Quality Gate del proyecto configurado', async () => {
        const fetchImpl = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ projectStatus: { status: 'OK' } }),
        });
        const client = createClient(fetchImpl);

        const response = await client.getQualityGate();

        expect(response.projectStatus.status).toBe('OK');
        const [url] = fetchImpl.mock.calls[0];
        expect(url.pathname).toBe('/api/qualitygates/project_status');
        expect(url.searchParams.get('projectKey')).toBe('pae-test');
    });

    test('propaga un error controlado cuando SonarQube rechaza la consulta', async () => {
        const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 403 });
        const client = createClient(fetchImpl);

        await expect(client.getMeasures()).rejects.toMatchObject({
            message: 'SonarQube respondio con estado 403',
            statusCode: 403,
        });
    });
});
