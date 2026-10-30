import { beforeEach, expect, test } from 'vitest';
import { saveOfflineLesson, getOfflineLesson, clearOfflineLessons, revokeOfflineLessonVersion } from '../src/features/lessons/services/offlineLessonStore';

beforeEach(() => localStorage.clear());

test('offline content is isolated by user and invalidated by version', () => {
  saveOfflineLesson('1', 'lesson', { text: 'private' }, 'v1');
  expect(getOfflineLesson('1', 'lesson', 'v1')).toEqual({ text: 'private' });
  expect(getOfflineLesson('1', 'lesson')).toEqual({ text: 'private' });
  expect(getOfflineLesson('2', 'lesson')).toBeNull();
  expect(getOfflineLesson('1', 'lesson', 'v2')).toBeNull();
  revokeOfflineLessonVersion('1', 'lesson');
  expect(getOfflineLesson('1', 'lesson')).toBeNull();
});

test('logout cleanup removes only the current user lessons', () => {
  saveOfflineLesson('1', 'a', 'one', 'v1');
  saveOfflineLesson('1', 'b', 'two', 'v1');
  saveOfflineLesson('12', 'a', 'other', 'v1');
  localStorage.setItem('preferences', 'keep');
  clearOfflineLessons('1');
  expect(getOfflineLesson('1', 'a')).toBeNull();
  expect(getOfflineLesson('1', 'b')).toBeNull();
  expect(getOfflineLesson('12', 'a')).toBe('other');
  expect(localStorage.getItem('preferences')).toBe('keep');
});

test('missing identity, version and malformed cache fail safely', () => {
  for (const args of [['', 'a', 'v'], ['1', '', 'v'], ['1', 'a', '']]) {
    saveOfflineLesson(args[0], args[1], 'private', args[2]);
  }
  expect(localStorage.length).toBe(0);
  expect(getOfflineLesson('', 'a')).toBeNull();
  expect(getOfflineLesson('1', '')).toBeNull();
  localStorage.setItem('pae:offline-lessons:1:a', '{broken');
  expect(getOfflineLesson('1', 'a')).toBeNull();
  clearOfflineLessons('');
  revokeOfflineLessonVersion('', 'a');
  expect(localStorage.length).toBe(1);
});
