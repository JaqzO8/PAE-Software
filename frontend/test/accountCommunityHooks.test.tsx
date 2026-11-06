import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { useForums, useForumDetail, useCreateForum } from '../src/features/forums/hooks/useForums';
import { useProfile } from '../src/features/profile/hooks/useProfile';
import * as forums from '../src/features/forums/services/forumsService';
import * as profile from '../src/features/profile/services/profileService';
const { toast } = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('../src/hooks/useToast', () => ({ useToast: () => ({ toast }) }));
vi.mock('../src/features/forums/services/forumsService');
vi.mock('../src/features/profile/services/profileService');
let root: Root, container: HTMLDivElement, current: any;
function Consumer({ hook }: { hook: () => unknown }) { current = hook(); return null; }
const mount = (hook: () => unknown) => act(async () => root.render(<Consumer hook={hook} />));
const post = { id: '7', title: 'Consulta QA', likes: 2, isLiked: false };
const user = { id: '7', firstName: 'Ana', lastName: 'Pérez', institution: 'QA', bio: 'Original' };
beforeEach(() => {
    vi.resetAllMocks(); localStorage.clear(); Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    vi.mocked(forums.getForums).mockResolvedValue([post, { ...post, id: '8' }] as any);
    vi.mocked(forums.getMyForums).mockResolvedValue([post] as any);
    vi.mocked(profile.getProfile).mockResolvedValue(user as any);
    vi.mocked(profile.getStats).mockResolvedValue({ totalPoints: 10 } as any);
    vi.mocked(profile.getSessions).mockResolvedValue([{ device: 'Browser', isCurrent: true }] as any);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
test.each([false, true])('forum list selects the requested scope (%s) and can refresh', async mine => {
    await mount(() => useForums(mine)); expect(current.isLoading).toBe(false);
    expect(current.forums).toHaveLength(mine ? 1 : 2);
    await act(async () => current.refresh());
    expect(mine ? forums.getMyForums : forums.getForums).toHaveBeenCalledTimes(2);
});
test('a failed forum list recovers on explicit refresh', async () => {
    vi.mocked(forums.getForums).mockRejectedValueOnce(new Error('network'));
    await mount(useForums); expect(current.forums).toEqual([]); expect(current.isLoading).toBe(false);
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    await act(async () => current.refresh()); expect(current.forums).toHaveLength(2);
});
test('like/unlike changes only the selected post after server acceptance and preserves it on failure', async () => {
    await mount(useForums); await act(async () => current.toggleLike('7'));
    expect(current.forums).toMatchObject([{ id: '7', likes: 3, isLiked: true }, { id: '8', likes: 2, isLiked: false }]);
    await act(async () => current.toggleLike('7')); expect(current.forums[0]).toMatchObject({ likes: 2, isLiked: false });
    vi.mocked(forums.likeForum).mockRejectedValueOnce(new Error('denied')); await act(async () => current.toggleLike('7'));
    expect(current.forums[0]).toMatchObject({ likes: 2, isLiked: false });
    expect(toast).toHaveBeenLastCalledWith(expect.objectContaining({ description: 'No se pudo actualizar el like.' }));
});
test('report feedback distinguishes successful submission from rejection', async () => {
    await mount(useForums); await act(async () => current.report('7', 'spam'));
    expect(forums.reportForum).toHaveBeenCalledWith('7', 'spam');
    expect(toast).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Reporte enviado' }));
    vi.mocked(forums.reportForum).mockRejectedValueOnce(new Error('network')); await act(async () => current.report('7', 'spam'));
    expect(toast).toHaveBeenLastCalledWith(expect.objectContaining({ variant: 'destructive' }));
});
test('forum detail retains confirmed data when a refresh fails', async () => {
    vi.mocked(forums.getForumDetail).mockResolvedValue(post as any);
    await mount(() => useForumDetail('7')); expect(current.forum).toEqual(post);
    vi.mocked(forums.getForumDetail).mockRejectedValueOnce(new Error('network')); await act(async () => current.refresh());
    expect(current.forum).toEqual(post); expect(current.isLoading).toBe(false);
    expect(toast).toHaveBeenLastCalledWith(expect.objectContaining({ variant: 'destructive' }));
});
test('missing forum ID never initiates a detail request', async () => {
    await mount(() => useForumDetail('')); expect(forums.getForumDetail).not.toHaveBeenCalled();
});
test('forum creation returns false on rejection and always releases its saving state', async () => {
    await mount(useCreateForum); let result;
    await act(async () => { result = await current.create({ title: 'Consulta QA' }); });
    expect(result).toBe(true); expect(current.isCreating).toBe(false);
    vi.mocked(forums.createForum).mockRejectedValueOnce(new Error('denied'));
    await act(async () => { result = await current.create({ title: 'Consulta QA' }); });
    expect(result).toBe(false); expect(current.isCreating).toBe(false);
});
test('profile combines identity, stats and active sessions', async () => {
    await mount(useProfile); expect(current.user).toEqual(user); expect(current.stats).toEqual({ totalPoints: 10 });
    expect(current.sessions).toHaveLength(1); expect(current.isLoading).toBe(false);
});
test('failed profile load exposes error and recovers without invented identity', async () => {
    vi.mocked(profile.getProfile).mockRejectedValueOnce(new Error('network')); await mount(useProfile);
    expect(current.user).toBeNull(); expect(current.isLoading).toBe(false);
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    await act(async () => current.refresh()); expect(current.user).toEqual(user);
});
test.each([false, true])('profile edits persist confirmed identity with or without cache (%s)', async cached => {
    if (cached) localStorage.setItem('user', JSON.stringify({ id: '7', email: 'qa@example.test', nombres: 'Ana' }));
    await mount(useProfile); const updated = { ...user, bio: 'Actualizada' }; vi.mocked(profile.updateProfile).mockResolvedValue(updated as any);
    await act(async () => current.updateProfile(updated)); expect(current.user).toEqual(updated); expect(current.isUpdating).toBe(false);
    if (cached) expect(JSON.parse(localStorage.getItem('user')!)).toMatchObject({ email: 'qa@example.test', bio: 'Actualizada', nombres: 'Ana' });
    expect(toast).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Perfil actualizado' }));
});
test('rejected profile edits preserve confirmed user and cached identity', async () => {
    localStorage.setItem('user', '{"id":"7"}'); await mount(useProfile);
    vi.mocked(profile.updateProfile).mockRejectedValueOnce(new Error('network'));
    await act(async () => current.updateProfile({ ...user, firstName: 'Not saved' }));
    expect(current.user).toEqual(user); expect(localStorage.getItem('user')).toBe('{"id":"7"}'); expect(current.isUpdating).toBe(false);
});
test.each([true, false])('password operation reports its actual result (%s)', async success => {
    await mount(useProfile); if (!success) vi.mocked(profile.updatePassword).mockRejectedValueOnce(new Error('wrong password'));
    let result; await act(async () => { result = await current.updatePassword({ currentPassword: 'current', newPassword: 'replacement', confirmPassword: 'replacement' }); });
    expect(result).toBe(success); expect(current.isUpdating).toBe(false);
    expect(toast).toHaveBeenLastCalledWith(expect.objectContaining({ title: success ? 'Contraseña actualizada' : 'Error' }));
});
test('session revocation refreshes the list only on success', async () => {
    await mount(useProfile); vi.mocked(profile.getSessions).mockResolvedValue([]);
    await act(async () => current.logoutAllSessions()); expect(current.sessions).toEqual([]); expect(profile.getSessions).toHaveBeenCalledTimes(2);
    vi.mocked(profile.logoutAllSessions).mockRejectedValueOnce(new Error('revoked'));
    await act(async () => current.logoutAllSessions()); expect(profile.getSessions).toHaveBeenCalledTimes(2);
    expect(toast).toHaveBeenLastCalledWith(expect.objectContaining({ variant: 'destructive' }));
});
