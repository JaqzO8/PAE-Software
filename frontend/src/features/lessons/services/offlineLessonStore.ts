const PREFIX = "pae:offline-lessons:";

type CachedLesson = {
  version: string;
  savedAt: string;
  lesson: unknown;
};

const keyFor = (userId: string, lessonId: string) => `${PREFIX}${userId}:${lessonId}`;

export const saveOfflineLesson = (userId: string, lessonId: string, lesson: unknown, version: string) => {
  if (!userId || !lessonId || !version) return;
  const payload: CachedLesson = { version, savedAt: new Date().toISOString(), lesson };
  localStorage.setItem(keyFor(userId, lessonId), JSON.stringify(payload));
};

export const getOfflineLesson = <T>(userId: string, lessonId: string, version?: string): T | null => {
  if (!userId || !lessonId) return null;
  try {
    const raw = localStorage.getItem(keyFor(userId, lessonId));
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedLesson;
    return !version || cached.version === version ? cached.lesson as T : null;
  } catch {
    return null;
  }
};

export const clearOfflineLessons = (userId: string) => {
  if (!userId) return;
  const prefix = `${PREFIX}${userId}:`;
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix)) localStorage.removeItem(key);
  }
};

export const revokeOfflineLessonVersion = (userId: string, lessonId: string) => {
  if (userId && lessonId) localStorage.removeItem(keyFor(userId, lessonId));
};
