const ORIGINAL_ENV = process.env;

const loadConfig = (overrides = {}) => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV, ...overrides };
  return require('../../config/env');
};

describe('configuracion parametrizada del Content Service', () => {
  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
  });

  test('aplica valores por defecto seguros para desarrollo', () => {
    const config = loadConfig({
      NODE_ENV: 'development',
      PORT: '',
      MAX_FILE_SIZE: '',
      CONTENT_DB_POOL_MAX: '',
      DB_POOL_MAX: '',
      JWT_SECRET: '',
    });

    expect(config.PORT).toBe(3003);
    expect(config.MAX_FILE_SIZE).toBe(52428800);
    expect(config.DB_POOL_MAX).toBe(20);
    expect(config.LOG_SQL).toBe(false);
  });

  test('respeta parametros numericos y booleanos validos', () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      PORT: '4100',
      MAX_FILE_SIZE: '2048',
      CONTENT_DB_POOL_MAX: '40',
      CONTENT_DB_POOL_MIN: '4',
      DB_POOL_ACQUIRE_MS: '15000',
      DB_POOL_IDLE_MS: '5000',
      LOG_SQL: 'true',
      JWT_SECRET: 'test-secret-not-used-in-production',
    });

    expect(config.PORT).toBe('4100');
    expect(config.MAX_FILE_SIZE).toBe(2048);
    expect(config.DB_POOL_MAX).toBe(40);
    expect(config.DB_POOL_MIN).toBe(4);
    expect(config.DB_POOL_ACQUIRE_MS).toBe(15000);
    expect(config.DB_POOL_IDLE_MS).toBe(5000);
    expect(config.LOG_SQL).toBe(true);
  });

  test('usa fallback cuando un parametro numerico es invalido', () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      MAX_FILE_SIZE: 'no-es-numero',
      CONTENT_DB_POOL_MAX: 'invalido',
      JWT_SECRET: 'test-secret-not-used-in-production',
    });

    expect(config.MAX_FILE_SIZE).toBe(52428800);
    expect(config.DB_POOL_MAX).toBe(20);
  });

  test.each(['default_jwt_secret', 'short'])(
    'rechaza el secreto debil %s en produccion',
    (jwtSecret) => {
      expect(() => loadConfig({
        NODE_ENV: 'production',
        JWT_SECRET: jwtSecret,
      })).toThrow('JWT_SECRET seguro es requerido en produccion');
    },
  );

  test('acepta un secreto robusto en produccion', () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      JWT_SECRET: 'una-clave-de-pruebas-con-mas-de-32-caracteres',
      DB_PASSWORD: 'password-inyectado-solo-en-la-prueba',
    });

    expect(config.NODE_ENV).toBe('production');
  });

  test('exige la clave de base de datos en produccion', () => {
    expect(() => loadConfig({
      NODE_ENV: 'production',
      JWT_SECRET: 'una-clave-de-pruebas-con-mas-de-32-caracteres',
      DB_PASSWORD: '',
      CONTENT_DB_PASSWORD: '',
    })).toThrow('DB_PASSWORD es requerido en produccion');
  });
});
