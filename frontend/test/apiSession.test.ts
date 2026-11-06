import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const transport = vi.hoisted(() => {
    const handlers: Record<string, Function> = {};
    const instance = Object.assign(vi.fn(), { defaults: { headers: { common: {} as Record<string, string> } }, interceptors: {
        request: { use: (ok: Function, fail: Function) => { handlers.request = ok; handlers.requestError = fail; } },
        response: { use: (ok: Function, fail: Function) => { handlers.response = ok; handlers.responseError = fail; } },
    } });
    return { handlers, instance, post: vi.fn() };
});
vi.mock('axios', () => ({ default: { create: () => transport.instance, post: transport.post } }));
import { hasToken, setAuthToken, removeAuthToken } from '../src/services/api';
beforeEach(() => {
    vi.clearAllMocks(); localStorage.clear();
    vi.stubGlobal('window', { location: { href: '/protected' } });
    vi.spyOn(console, 'log').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
test('explicit sign-in and sign-out consistently update storage and default authorization', () => {
    expect(hasToken()).toBe(false); setAuthToken('session-one'); expect(hasToken()).toBe(true);
    expect(transport.instance.defaults.headers.common.Authorization).toBe('Bearer session-one');
    removeAuthToken(); expect(hasToken()).toBe(false); expect(transport.instance.defaults.headers.common.Authorization).toBeUndefined();
});
test('requests read the current token rather than a stale previous session', () => {
    const request = { url: '/profile', method: 'get', headers: {} as Record<string, string> };
    expect(transport.handlers.request(request)).toBe(request); expect(request.headers.Authorization).toBeUndefined();
    localStorage.setItem('token', 'fresh-session'); transport.handlers.request(request);
    expect(request.headers.Authorization).toBe('Bearer fresh-session');
    expect(transport.handlers.request({ url: '/health' })).toEqual({ url: '/health' });
});
test('success response and request failures preserve the original transport data', async () => {
    const response = { config: { url: '/profile' }, status: 200, data: { id: 7 } };
    expect(transport.handlers.response(response)).toBe(response);
    const error = { code: 'NETWORK', sensitivePayload: 'not-to-be-logged' };
    await expect(transport.handlers.requestError(error)).rejects.toBe(error);
    expect(console.error).toHaveBeenCalledWith('API request failed', { code: 'NETWORK' });
});
test('expired token refreshes once and retries the original operation with the new session', async () => {
    localStorage.setItem('token', 'expired'); transport.post.mockResolvedValue({ data: { token: 'renewed' } });
    transport.instance.mockResolvedValue({ data: 'accepted' });
    const config = { url: '/content/favorites', method: 'post', data: { id: 8 }, headers: {} };
    expect(await transport.handlers.responseError({ config, response: { status: 401 } })).toEqual({ data: 'accepted' });
    expect(transport.post).toHaveBeenCalledWith('/api/auth/refresh', {}, { headers: { Authorization: 'Bearer expired' } });
    expect(localStorage.getItem('token')).toBe('renewed');
    expect(transport.instance).toHaveBeenCalledWith({ ...config, _retry: true, headers: { Authorization: 'Bearer renewed' } });
});
test.each(['/auth/login', 'auth/register', '/auth/mfa/complete', '/auth/quick-login?code=qa'])('invalid credentials on %s never trigger refresh', async url => {
    localStorage.setItem('token', 'old-session');
    const error = { config: { url }, response: { status: 401 } };
    await expect(transport.handlers.responseError(error)).rejects.toBe(error);
    expect(transport.post).not.toHaveBeenCalled(); expect(localStorage.getItem('token')).toBe('old-session');
});
test.each([403, 404, 500, undefined])('HTTP %s and network failures do not erase a valid session', async status => {
    localStorage.setItem('token', 'valid'); const error = { config: { url: '/content' }, response: status ? { status } : undefined };
    await expect(transport.handlers.responseError(error)).rejects.toBe(error);
    expect(transport.post).not.toHaveBeenCalled(); expect(localStorage.getItem('token')).toBe('valid');
});
test('failed refresh clears identity and redirects to sign-in without retrying a mutation', async () => {
    localStorage.setItem('token', 'expired'); localStorage.setItem('user', '{"id":7}');
    const failure = new Error('revoked'); transport.post.mockRejectedValue(failure);
    await expect(transport.handlers.responseError({ config: { url: '/content', headers: {} }, response: { status: 401 } })).rejects.toBe(failure);
    expect(localStorage.getItem('token')).toBeNull(); expect(localStorage.getItem('user')).toBeNull();
    expect(window.location.href).toBe('/login'); expect(transport.instance).not.toHaveBeenCalled();
});
test.each([undefined, { url: '/content', _retry: true }])('unretryable 401 is propagated without a refresh loop: %j', async config => {
    localStorage.setItem('token', 'expired'); const error = { config, response: { status: 401 } };
    await expect(transport.handlers.responseError(error)).rejects.toBe(error); expect(transport.post).not.toHaveBeenCalled();
});
