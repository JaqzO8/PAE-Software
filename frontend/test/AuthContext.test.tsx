import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import * as auth from '../src/features/auth/services/authServices';
import { saveOfflineLesson, getOfflineLesson } from '../src/features/lessons/services/offlineLessonStore';

const { navigate, toast } = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../src/hooks/useToast', () => ({ useToast: () => ({ toast }) }));
vi.mock('../src/features/auth/services/authServices', () => ({
  verifyToken: vi.fn(), login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
}));
const user: auth.AuthUser = { id: '1', identificador_unico: 'one', email: 'one@example.test', nombres: 'Ana', apellidos: 'QA', rol: 'docente', fecha_registro: '2026-01-01', primer_ingreso: true, activo: true };
let current: ReturnType<typeof useAuth>;
let root: Root;
let container: HTMLDivElement;
function Consumer() { current = useAuth(); return <span>{current.user?.nombres ?? 'anonymous'}</span>; }
async function mount() { await act(async () => root.render(<AuthProvider><Consumer /></AuthProvider>)); }

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
});

test('restores only verified identity, replacing stale saved role', async () => {
  localStorage.setItem('token', 'stored'); localStorage.setItem('user', '{}');
  vi.mocked(auth.verifyToken).mockResolvedValue({ valid: true, user });
  await mount();
  expect(current.isAuthenticated).toBe(true);
  expect(current.isLoading).toBe(false);
  expect(current.token).toBe('stored');
  expect(localStorage.getItem('role')).toBe('docente');
});

test.each(['invalid', 'unavailable'])('removes stale credentials when verification is %s', async mode => {
  localStorage.setItem('token', 'stored'); localStorage.setItem('user', '{}'); localStorage.setItem('role', 'admin');
  if (mode === 'invalid') vi.mocked(auth.verifyToken).mockResolvedValue({ valid: false });
  else vi.mocked(auth.verifyToken).mockRejectedValue(new Error('offline'));
  await mount();
  expect(current.isAuthenticated).toBe(false);
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('role')).toBeNull();
});

test.each([true, false])('logout clears private offline lessons even if remote logout fails (%s)', async fails => {
  await mount();
  await act(async () => current.setAuthData(user, 'active'));
  saveOfflineLesson('1', 'lesson', 'private', 'v1');
  saveOfflineLesson('2', 'lesson', 'other', 'v1');
  if (fails) vi.mocked(auth.logout).mockRejectedValue(new Error('offline'));
  await act(async () => current.logout());
  expect(current.isAuthenticated).toBe(false);
  expect(getOfflineLesson('1', 'lesson')).toBeNull();
  expect(getOfflineLesson('2', 'lesson')).toBe('other');
  expect(localStorage.getItem('token')).toBeNull();
  expect(navigate).toHaveBeenCalledWith('/', { replace: true });
});

test('refresh rotates local token; failed refresh logs out', async () => {
  await mount();
  await act(async () => current.setAuthData(user, 'active'));
  vi.mocked(auth.refreshToken).mockResolvedValueOnce('rotated').mockRejectedValueOnce(new Error('expired'));
  await act(async () => current.refreshSession());
  expect(current.token).toBe('rotated');
  expect(localStorage.getItem('token')).toBe('rotated');
  await act(async () => current.refreshSession());
  expect(current.isAuthenticated).toBe(false);
});

test('profile updates preserve identity and cannot create an anonymous session', async () => {
  await mount();
  await act(async () => current.updateUser({ nombres: 'Ignored' }));
  expect(current.user).toBeNull();
  await act(async () => current.setAuthData(user, 'active'));
  await act(async () => current.updateUser({ nombres: 'Updated' }));
  expect(current.user?.id).toBe('1');
  expect(JSON.parse(localStorage.getItem('user')!).nombres).toBe('Updated');
});

test.each(['docente', 'estudiante'] as const)('successful login persists identity and routes %s', async rol => {
  await mount();
  vi.mocked(auth.login).mockResolvedValue({ user: { ...user, rol, primer_ingreso: rol === 'docente' }, token: 'fresh' });
  await act(async () => current.login(user.email, 'password'));
  expect(current.isAuthenticated).toBe(true);
  expect(localStorage.getItem('token')).toBe('fresh');
  await act(async () => vi.advanceTimersByTimeAsync(100));
  expect(navigate).toHaveBeenCalledWith(`/${rol}`, { replace: true });
  window.history.replaceState({}, '', `/${rol}`);
  await act(async () => vi.advanceTimersByTimeAsync(300));
});

test('rejected login returns error and finishes loading without creating a session', async () => {
  await mount();
  vi.mocked(auth.login).mockRejectedValue(new Error('Credenciales incorrectas'));
  await act(async () => { await expect(current.login(user.email, 'wrong')).rejects.toThrow('Credenciales'); });
  expect(current.isLoading).toBe(false);
  expect(current.isAuthenticated).toBe(false);
  expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
});
