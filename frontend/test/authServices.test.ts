import { beforeEach, expect, test, vi } from 'vitest';
import * as auth from '../src/features/auth/services/authServices';
import { api } from '../src/services/api';

vi.mock('../src/services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
const post = vi.mocked(api.post);
const get = vi.mocked(api.get);
const put = vi.mocked(api.put);
const credentials = { email: 'USER@Example.test', password: 'private fixture' };
const registration = { ...credentials, nombres: 'Ana', apellidos: 'QA', isTeacher: false };
const failure = (status: number, data = {}) => ({ isAxiosError: true, response: { status, data } });
beforeEach(() => vi.resetAllMocks());

test.each(['estudiante', 'docente', 'admin'])('login accepts verified role %s and normalizes email', async rol => {
  const response = { token: 'opaque', user: { rol } };
  post.mockResolvedValue({ data: response });
  expect(await auth.login(credentials)).toEqual(response);
  expect(post).toHaveBeenCalledWith('/auth/login', { ...credentials, email: 'user@example.test' });
});

test.each([null, {}, { token: 'opaque' }, { token: 'opaque', user: { rol: 'owner' } }])('login rejects malformed identity %j', async data => {
  post.mockResolvedValue({ data });
  await expect(auth.login(credentials)).rejects.toThrow(/inválid/);
});

test.each([[401, 'Credenciales incorrectas'], [403, 'Cuenta desactivada'], [404, 'Usuario no encontrado'], [500, 'Error al iniciar sesión']])('login translates HTTP %s', async (status, message) => {
  post.mockRejectedValue(failure(Number(status)));
  await expect(auth.login(credentials)).rejects.toThrow(String(message));
});

test('registration normalizes identity and rejects empty server response', async () => {
  post.mockResolvedValueOnce({ data: { token: 'registered' } }).mockResolvedValueOnce({ data: null });
  expect(await auth.register(registration)).toEqual({ token: 'registered' });
  expect(post).toHaveBeenCalledWith('/auth/register', { ...registration, email: 'user@example.test' });
  await expect(auth.register(registration)).rejects.toThrow('Respuesta inválida');
});

test.each([
  [409, {}, 'Este correo ya está registrado'],
  [400, { errors: [{ message: 'Email inválido' }, { message: 'Contraseña corta' }] }, 'Email inválido, Contraseña corta'],
  [400, { message: 'Rechazado' }, 'Rechazado'],
  [400, {}, 'Datos de registro inválidos'],
  [503, {}, 'No se pudo crear la cuenta'],
])('registration explains rejected requests (%s)', async (status, data, message) => {
  post.mockRejectedValue(failure(status, data));
  await expect(auth.register(registration)).rejects.toThrow(message);
});

test('session verification fails closed and remote logout failures permit local cleanup', async () => {
  get.mockResolvedValueOnce({ data: { valid: true, user: { id: '1' } } }).mockRejectedValueOnce(new Error('offline'));
  expect(await auth.verifyToken()).toEqual({ valid: true, user: { id: '1' } });
  expect(await auth.verifyToken()).toEqual({ valid: false });
  post.mockRejectedValue(new Error('offline'));
  await expect(auth.logout()).resolves.toBeUndefined();
  await expect(auth.refreshToken()).rejects.toThrow('Sesión expirada');
  post.mockResolvedValue({ data: { token: 'rotated' } });
  expect(await auth.refreshToken()).toBe('rotated');
  await auth.logout();
});

test('profile and password changes expose success and failure', async () => {
  const profile = { nombres: 'Ana', apellidos: 'QA' };
  put.mockResolvedValueOnce({ data: { user: profile } }).mockResolvedValueOnce({ data: { shouldLogout: true } });
  expect(await auth.updateProfile(profile)).toEqual(profile);
  expect(await auth.updatePassword({ currentPassword: 'old', newPassword: 'new' })).toEqual({ shouldLogout: true });
  put.mockRejectedValue(new Error('offline'));
  await expect(auth.updateProfile(profile)).rejects.toThrow('No se pudo actualizar');
  await expect(auth.updatePassword({ currentPassword: 'old', newPassword: 'new' })).rejects.toThrow('No se pudo cambiar');
});

test('MFA, recovery and session operations preserve their request contracts', async () => {
  post.mockResolvedValue({ data: { message: 'ok' } });
  get.mockResolvedValue({ data: { sessions: [{ id: 'session' }] } });
  await auth.requestPasswordReset('user@example.test');
  expect(post).toHaveBeenLastCalledWith('/auth/forgot-password', { email: 'user@example.test' });
  await auth.resetPassword('once', 'new');
  expect(post).toHaveBeenLastCalledWith('/auth/reset-password', { token: 'once', newPassword: 'new' });
  await auth.requestTwoFactor();
  expect(post).toHaveBeenLastCalledWith('/auth/2fa/request');
  await auth.verifyTwoFactor('123456');
  expect(post).toHaveBeenLastCalledWith('/auth/2fa/verify', { code: '123456' });
  expect(await auth.getSessions()).toEqual([{ id: 'session' }]);
  await auth.logoutAllSessions();
  expect(post).toHaveBeenLastCalledWith('/auth/logout-all');
});
