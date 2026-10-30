import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import Planning from '../src/pages/student/Planning';
import { api } from '../src/services/api';

const { toast } = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('../src/hooks/useToast', () => ({ useToast: () => ({ toast }) }));
vi.mock('../src/services/api', () => ({ api: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
let root: Root, container: HTMLDivElement;
const preference = { preferredDays: [1], startTime: '17:00', endTime: '19:00', subjects: ['Física'], remindersEnabled: true, timeZone: 'America/Lima' };
const overview = {
  preference,
  settings: { pomodoroFocusMinutes: 1, pomodoroBreakMinutes: 5, sessionDurationMinutes: 30, reminderLeadMinutes: 10, maxSessionsPerDay: 3 },
  suggestions: [{ title: 'Repasar física', subject: 'Física', scheduledAt: '2026-11-01T17:00:00Z', durationMinutes: 30 }],
  reminders: [{ id_recordatorio: 7, titulo: 'Recordatorio física', programado_para: '2026-11-01T17:00:00Z' }],
};
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.mocked(api.get).mockResolvedValue({ data: { data: structuredClone(overview) } });
  vi.mocked(api.put).mockImplementation(async (_url, data) => ({ data: { data } }));
  vi.mocked(api.patch).mockResolvedValue({ data: { data: {} } });
  vi.mocked(api.post).mockResolvedValue({ data: { data: [] } });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); });
async function mount() { await act(async () => root.render(<Planning />)); }
async function click(label: string) {
  const button = [...container.querySelectorAll('button')].find(item => item.textContent?.trim() === label);
  expect(button, label).toBeDefined();
  await act(async () => button!.click());
}

test('loads planning and saves selected days through the Learning API', async () => {
  await mount();
  expect(api.get).toHaveBeenCalledWith('/learning/planning');
  expect(container.textContent).toContain('Repasar física');
  await click('Lun'); await click('Mar'); await click('Guardar');
  expect(api.put).toHaveBeenCalledWith('/learning/planning/preferences', { ...preference, preferredDays: [2] });
  expect(toast).toHaveBeenCalledWith({ title: 'Preferencias guardadas' });
});

test('generates, completes and cancels reminders using their persisted ID', async () => {
  await mount(); await click('Crear recordatorios');
  expect(api.post).toHaveBeenCalledWith('/learning/planning/reminders/generate');
  await click('Completar');
  expect(api.patch).toHaveBeenCalledWith('/learning/planning/reminders/7/status', { status: 'completado' });
  await click('Cancelar');
  expect(api.patch).toHaveBeenCalledWith('/learning/planning/reminders/7/cancel');
  expect(toast).toHaveBeenCalledWith({ title: 'Recordatorio cancelado' });
});

test('timer starts, pauses without decrementing, resumes and finishes', async () => {
  vi.mocked(api.post).mockImplementation(async (_url, data) => ({ data: { data: { currentState: data.action === 'pause' ? 'paused' : data.action === 'finish' ? 'completed' : 'running', secondsElapsed: data.secondsElapsed } } }));
  await mount(); await click('Iniciar');
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(container.textContent).toContain('00:59');
  await click('Pausar');
  await act(async () => vi.advanceTimersByTimeAsync(5000));
  expect(container.textContent).toContain('00:59');
  await click('Iniciar');
  expect(api.post).toHaveBeenLastCalledWith('/learning/planning/pomodoro', { currentState: 'paused', action: 'resume', secondsElapsed: 0 });
  for (let i = 0; i < 59; i++) await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(api.post).toHaveBeenLastCalledWith('/learning/planning/pomodoro', { currentState: 'running', action: 'finish', secondsElapsed: 0 });
  expect(container.textContent).toContain('00:00');
});

test('rejected mutations report errors without showing success', async () => {
  await mount();
  vi.mocked(api.post).mockRejectedValue(new Error('offline'));
  vi.mocked(api.put).mockRejectedValue(new Error('offline'));
  vi.mocked(api.patch).mockRejectedValue(new Error('offline'));
  for (const label of ['Guardar', 'Crear recordatorios', 'Cancelar', 'Iniciar']) await click(label);
  expect(toast).toHaveBeenCalledTimes(4);
  expect(toast.mock.calls.every(([message]) => message.variant === 'destructive')).toBe(true);
});

test('unavailable overview reports failure and empty reminders show empty state', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { data: { ...overview, reminders: [] } } });
  await mount(); expect(container.textContent).toContain('No hay recordatorios programados');
  vi.mocked(api.get).mockRejectedValue(new Error('offline'));
  await click('Guardar');
  expect(toast).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'No se pudo cargar la planificacion', variant: 'destructive' }));
});
