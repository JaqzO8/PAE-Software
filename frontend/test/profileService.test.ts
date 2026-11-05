import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { api } from '../src/services/api';
import * as auth from '../src/features/auth/services/authServices';
import * as profile from '../src/features/profile/services/profileService';

vi.mock('../src/services/api', () => ({ api: { get: vi.fn() } }));
vi.mock('../src/features/auth/services/authServices', () => ({ updateProfile: vi.fn(), updatePassword: vi.fn(), getSessions: vi.fn(), logoutAllSessions: vi.fn() }));
const user = { id: '7', nombres: 'Ana', apellidos: 'Pérez', email: 'qa@example.test', rol: 'estudiante' as const, fecha_registro: '2026-01-01' };
const changes = { firstName: 'Ana María', lastName: 'Pérez', institution: 'Instituto QA', bio: 'Biografía' };
beforeEach(() => {
    vi.resetAllMocks(); vi.stubEnv('VITE_USE_MOCKS', 'false'); localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {}); vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.useRealTimers(); });
test('verified profile maps identity and optional institution and avatar', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { user } }).mockResolvedValueOnce({ data: { user: { ...user, institucion: 'QA', avatar: '/avatar.png', bio: 'Bio' } } });
    expect(await profile.getProfile()).toMatchObject({ id: '7', firstName: 'Ana', institution: 'Sin institución asignada', avatar: expect.stringContaining('qa@example.test') });
    expect(await profile.getProfile()).toMatchObject({ institution: 'QA', avatar: '/avatar.png', bio: 'Bio' });
    expect(api.get).toHaveBeenCalledWith('/auth/verify');
});
test('successful edits update cached fields only after the server accepts them', async () => {
    localStorage.setItem('user', JSON.stringify(user));
    vi.mocked(auth.updateProfile).mockResolvedValue({ ...user, nombres: changes.firstName, institucion: changes.institution });
    expect(await profile.updateProfile(changes)).toMatchObject({ firstName: changes.firstName, institution: changes.institution });
    expect(auth.updateProfile).toHaveBeenCalledWith({ nombres: changes.firstName, apellidos: changes.lastName, institucion: changes.institution, bio: changes.bio });
    expect(JSON.parse(localStorage.getItem('user')!)).toMatchObject({ email: user.email, rol: user.rol, nombres: changes.firstName });
    localStorage.removeItem('user');
    expect((await profile.updateProfile(changes)).firstName).toBe(changes.firstName);
});
test('rejected edits preserve the stored identity and propagate the failure', async () => {
    localStorage.setItem('user', JSON.stringify(user));
    const failure = new Error('Service unavailable'); vi.mocked(auth.updateProfile).mockRejectedValue(failure);
    await expect(profile.updateProfile(changes)).rejects.toBe(failure);
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(user);
});
test('logout-all does not pretend sessions were revoked when the request fails', async () => {
    await profile.logoutAllSessions(); expect(auth.logoutAllSessions).toHaveBeenCalledTimes(1);
    const failure = new Error('Revocation unavailable'); vi.mocked(auth.logoutAllSessions).mockRejectedValue(failure);
    await expect(profile.logoutAllSessions()).rejects.toBe(failure);
});
test('password change preserves the current password and propagates server rejection', async () => {
    await profile.updatePassword({ currentPassword: 'current', newPassword: 'new-password', confirmPassword: 'new-password' });
    expect(auth.updatePassword).toHaveBeenCalledWith({ currentPassword: 'current', newPassword: 'new-password' });
    const failure = new Error('Wrong password'); vi.mocked(auth.updatePassword).mockRejectedValue(failure);
    await expect(profile.updatePassword({ newPassword: 'new-password', confirmPassword: 'new-password' })).rejects.toBe(failure);
});
test('session display preserves current-device status and formats timestamps', async () => {
    vi.mocked(auth.getSessions).mockResolvedValue([{ id: '1', device: 'QA browser', location: 'Local QA', lastActive: '2026-01-01T12:00:00Z', isCurrent: true }]);
    expect(await profile.getSessions()).toEqual([{ device: 'QA browser', location: 'Local QA', lastActive: expect.any(String), isCurrent: true }]);
});
test('explicit demo profile uses cached identity without contacting authentication', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'true'); vi.useFakeTimers(); localStorage.setItem('user', JSON.stringify(user));
    const pending = profile.getProfile(); await vi.runAllTimersAsync();
    expect(await pending).toMatchObject({ id: '7', firstName: 'Ana' });
    const updated = profile.updateProfile(changes); await vi.runAllTimersAsync();
    expect(await updated).toMatchObject({ firstName: changes.firstName, bio: changes.bio });
    expect(api.get).not.toHaveBeenCalled(); expect(auth.updateProfile).not.toHaveBeenCalled();
});
test.each([null, '{invalid-json'])('offline profile handles missing or corrupt local identity: %s', async cached => {
    vi.useFakeTimers(); if (cached) localStorage.setItem('user', cached);
    vi.mocked(api.get).mockRejectedValue(new Error('offline'));
    const pending = profile.getProfile(); await vi.runAllTimersAsync();
    expect((await pending).id).toBe(cached ? 'error' : 'no-user');
});
