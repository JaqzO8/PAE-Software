import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import * as service from '../src/features/learning/services/learningService';
import { api } from '../src/services/api';
import * as queue from '../src/features/learning/services/offlineAttempts';
vi.mock('../src/services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('../src/features/learning/services/offlineAttempts', () => ({ getOfflineAttempts: vi.fn(), markOfflineAttemptTried: vi.fn(), queueOfflineAttempt: vi.fn(), removeOfflineAttempt: vi.fn() }));
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv('VITE_USE_MOCKS', 'false'); });
afterEach(() => vi.unstubAllEnvs());
const config = { universityId: 'unmsm', difficulty: 'facil' as const };
const room = { topic: 'Física', difficulty: 'medio' as const, maxPlayers: 4 };
const trivia = { topic: 'Física', questionsCount: 5, maxPlayers: 4 };

test.each([
  ['universities', () => service.getUniversities(), 'get', '/learning/universities'],
  ['simulacro', () => service.startSimulacro(config), 'post', '/learning/simulacro/start'],
  ['challenge rooms', () => service.getChallengeRooms(), 'get', '/learning/challenges/rooms'],
  ['new challenge', () => service.createChallengeRoom(room), 'post', '/learning/challenges/rooms'],
  ['daily trivia', () => service.getDailyTrivia(), 'get', '/learning/trivia/daily'],
  ['trivia rooms', () => service.getTriviaRooms(), 'get', '/learning/trivia/rooms'],
  ['new trivia', () => service.createTriviaRoom(trivia), 'post', '/learning/trivia/rooms'],
] as const)('%s returns server data and never invents a success on failure', async (_label, operation, method, route) => {
  vi.mocked(api[method]).mockResolvedValueOnce({ data: { id: 'server-issued' } });
  expect(await operation()).toEqual({ id: 'server-issued' });
  expect(vi.mocked(api[method]).mock.calls[0][0]).toBe(route);
  const error = { response: { status: 403, data: { message: 'denied' } } };
  vi.mocked(api[method]).mockRejectedValueOnce(error);
  await expect(operation()).rejects.toBe(error);
});

test.each([
  ['challenge join', () => service.joinChallengeRoom('7'), '/learning/challenges/rooms/7/join'],
  ['challenge leave', () => service.leaveChallengeRoom('7'), '/learning/challenges/rooms/7/leave'],
  ['challenge start', () => service.startChallengeMatch('7'), '/learning/challenges/rooms/7/match/start'],
  ['challenge next', () => service.nextChallengeQuestion('7'), '/learning/challenges/rooms/7/match/next'],
  ['trivia join', () => service.joinTriviaRoom('7'), '/learning/trivia/rooms/7/join'],
  ['trivia start', () => service.startTriviaMatch('7'), '/learning/trivia/rooms/7/match/start'],
  ['trivia next', () => service.nextTriviaQuestion('7'), '/learning/trivia/rooms/7/match/next'],
] as const)('%s targets the selected room', async (_label, operation, route) => {
  vi.mocked(api.post).mockResolvedValue({ data: { room: { id: '7' } } });
  expect(await operation()).toEqual({ room: { id: '7' } });
  expect(api.post).toHaveBeenCalledWith(route);
});

test('live answers preserve question ID and selected answer for both game modes', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { accepted: true } });
  await service.answerChallengeQuestion('7', '11', 2);
  expect(api.post).toHaveBeenLastCalledWith('/learning/challenges/rooms/7/match/answer', { questionId: '11', answer: 2 });
  await service.answerTriviaQuestion('8', '12', 0);
  expect(api.post).toHaveBeenLastCalledWith('/learning/trivia/rooms/8/match/answer', { questionId: '12', answer: 0 });
});

const submission = { simulacroId: '12', answers: [0, 1], timeSpent: 30 };
test('submission uses stable idempotency key and propagates server rejection', async () => {
  vi.mocked(api.post).mockResolvedValueOnce({ data: { score: 50 } });
  expect(await service.submitSimulacro(submission)).toEqual({ score: 50 });
  expect(api.post).toHaveBeenCalledWith('/learning/simulacro/submit', submission, { headers: { 'Idempotency-Key': 'simulacro-12-submit-v1' } });
  const error = { response: { status: 409 } };
  vi.mocked(api.post).mockRejectedValueOnce(error);
  await expect(service.submitSimulacro(submission)).rejects.toBe(error);
  expect(queue.queueOfflineAttempt).not.toHaveBeenCalled();
});

test('network failure queues submission explicitly as pending, without confirmed solutions', async () => {
  vi.mocked(api.post).mockRejectedValue(new Error('offline'));
  vi.mocked(queue.queueOfflineAttempt).mockResolvedValue({ id: 'queued', submission, attempts: 0, createdAt: '2026-01-01' });
  expect(await service.submitSimulacro(submission)).toMatchObject({ offlinePending: true, offlineAttemptId: 'queued', solutions: [] });
  expect(queue.queueOfflineAttempt).toHaveBeenCalledWith(submission);
});

test('synchronization removes successes and conflicts but preserves network failures for retry', async () => {
  vi.mocked(queue.getOfflineAttempts).mockResolvedValue(['ok', 'conflict', 'offline'].map(id => ({ id, submission: { ...submission, simulacroId: id }, attempts: 0, createdAt: '2026-01-01' })));
  vi.mocked(api.post).mockResolvedValueOnce({ data: {} }).mockRejectedValueOnce({ response: { status: 409 } }).mockRejectedValueOnce(new Error('network'));
  expect(await service.syncOfflineAttempts()).toEqual(['ok']);
  expect(queue.removeOfflineAttempt).toHaveBeenCalledWith('ok');
  expect(queue.removeOfflineAttempt).toHaveBeenCalledWith('conflict');
  expect(queue.removeOfflineAttempt).not.toHaveBeenCalledWith('offline');
  expect(queue.markOfflineAttemptTried).toHaveBeenCalledWith('offline');
});
