import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { useChallenges, useTrivia, useSimulacros } from '../src/features/learning/hooks/useLearning';
import * as service from '../src/features/learning/services/learningService';
import { loadActiveExam } from '../src/features/learning/services/activeExamCache';
const { toast, callbacks, cleanup } = vi.hoisted(() => ({ toast: vi.fn(), callbacks: {} as Record<string, (data: any) => void>, cleanup: vi.fn() }));
vi.mock('../src/hooks/useToast', () => ({ useToast: () => ({ toast }) }));
vi.mock('../src/features/learning/services/learningService');
vi.mock('../src/features/learning/services/learningRealtime', () => ({
  connectLearningSocket: (handlers: typeof callbacks) => { Object.assign(callbacks, handlers); return cleanup; },
  subscribeChallengeRoom: vi.fn(), subscribeTriviaRoom: vi.fn(),
}));
let root: Root, container: HTMLDivElement, current: any;
function Consumer({ hook }: { hook: () => unknown }) { current = hook(); return null; }
const room = { id: '7', status: 'waiting', currentPlayers: 1, maxPlayers: 4 };
const game = { room: { ...room, status: 'playing' }, currentQuestion: { id: '11' }, totalQuestions: 5 };
beforeEach(() => {
  vi.resetAllMocks(); localStorage.clear();
  for (const key of Object.keys(callbacks)) delete callbacks[key];
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  vi.mocked(service.getChallengeRooms).mockResolvedValue([]);
  vi.mocked(service.getTriviaRooms).mockResolvedValue([]);
  vi.mocked(service.getUniversities).mockResolvedValue([]);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function mount(hook: () => unknown) { await act(async () => root.render(<Consumer hook={hook} />)); }

for (const mode of ['Challenge', 'Trivia'] as const) {
  const hook = mode === 'Challenge' ? useChallenges : useTrivia;
  const names = {
    create: `create${mode}Room`, join: `join${mode}Room`, start: `start${mode}Match`,
    answer: `answer${mode}Question`, next: `next${mode}Question`, list: `get${mode}Rooms`,
  } as const;
  const mock = (name: string) => vi.mocked((service as any)[name]);
  test(`${mode}: room lifecycle and answers update visible state`, async () => {
    await mount(hook);
    expect(await current.answerQuestion(0)).toBeNull();
    expect(await current.nextQuestion()).toBeNull();
    mock(names.create).mockResolvedValue(room);
    await act(async () => current.createRoom({ topic: 'QA' }));
    expect(current.rooms).toEqual([room]);
    mock(names.join).mockResolvedValue({ ...room, currentPlayers: 2 });
    await act(async () => current.joinRoom('7'));
    expect(current.rooms[0].currentPlayers).toBe(2);
    mock(names.start).mockResolvedValue(game);
    await act(async () => current.startGame('7'));
    for (const correct of [true, false]) {
      mock(names.answer).mockResolvedValue({ ...game, lastAnswer: { correct, points: correct ? 10 : 0 } });
      await act(async () => current.answerQuestion(2));
      expect(mock(names.answer)).toHaveBeenLastCalledWith('7', '11', 2);
      expect(toast).toHaveBeenLastCalledWith(expect.objectContaining({ title: correct ? 'Respuesta correcta' : 'Respuesta registrada' }));
    }
    mock(names.next).mockResolvedValue({ ...game, room: { ...room, status: 'finished' } });
    await act(async () => current.nextQuestion());
    expect(current.rooms).toEqual([]);
  });

  test(`${mode}: failed operations surface errors and release loading state`, async () => {
    mock(names.list).mockRejectedValue(new Error('unavailable'));
    await mount(hook);
    expect(current.isLoading).toBe(false);
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    const error = { response: { data: { message: 'Denied' } } };
    for (const [method, apiName, argument] of [['createRoom', names.create, {}], ['joinRoom', names.join, '7'], ['startGame', names.start, '7']] as const) {
      mock(apiName).mockRejectedValue(error);
      await act(async () => { await expect(current[method](argument)).rejects.toBe(error); });
      expect(current.isLoading).toBe(false);
    }
    mock(names.start).mockResolvedValue(game);
    await act(async () => current.startGame('7'));
    mock(names.answer).mockRejectedValue(error);
    await act(async () => { await expect(current.answerQuestion(0)).rejects.toBe(error); });
    expect(toast).toHaveBeenLastCalledWith(expect.objectContaining({ description: 'Denied' }));
  });

  test(`${mode}: realtime updates deduplicate rooms and do not replace another active game`, async () => {
    await mount(hook);
    await act(async () => callbacks[`on${mode}RoomsUpdated`]({ room }));
    await act(async () => callbacks[`on${mode}RoomUpdated`]({ room: { ...room, currentPlayers: 3 } }));
    expect(current.rooms).toHaveLength(1);
    await act(async () => callbacks[`on${mode}GameUpdated`]({ game }));
    await act(async () => callbacks[`on${mode}GameUpdated`]({ game: { ...game, room: { ...room, id: 'other' } } }));
    expect(current.activeGame.room.id).toBe('7');
    await act(async () => callbacks[`on${mode}RoomUpdated`]({ room: { ...room, status: 'finished' } }));
    expect(current.rooms.some((item: any) => item.id === '7')).toBe(false);
    await act(async () => root.render(null));
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
}

test('trivia opens existing games, starts missing games and propagates other failures', async () => {
  await mount(useTrivia);
  vi.mocked(service.getTriviaMatch).mockResolvedValueOnce(game as any).mockRejectedValueOnce({ response: { status: 404 } }).mockRejectedValueOnce(new Error('offline'));
  vi.mocked(service.startTriviaMatch).mockResolvedValue(game as any);
  await act(async () => current.openGame('7'));
  expect(current.activeGame).toEqual(game);
  await act(async () => current.openGame('7'));
  expect(service.startTriviaMatch).toHaveBeenCalledWith('7');
  await act(async () => { await expect(current.openGame('7')).rejects.toThrow('offline'); });
});

test('simulacro persists the authoritative question list and surfaces failed starts', async () => {
  vi.mocked(service.getUniversities).mockRejectedValue(new Error('offline'));
  await mount(useSimulacros);
  expect(current.isLoading).toBe(false);
  const exam = { id: 'attempt', questions: [{ id: '11' }], timeLimit: 600 };
  vi.mocked(service.startSimulacro).mockResolvedValueOnce(exam as any).mockRejectedValueOnce(new Error('denied'));
  await act(async () => current.startExam({ universityId: 'unmsm', difficulty: 'facil' }));
  expect(loadActiveExam()).toMatchObject({ simulacro: exam, answers: [null], timeRemaining: 600 });
  await act(async () => { await expect(current.startExam({})).rejects.toThrow('denied'); });
  expect(current.isLoading).toBe(false);
});
