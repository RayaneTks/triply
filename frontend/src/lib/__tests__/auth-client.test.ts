import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { login, register, me, logout } from '../auth-client';

function mockFetch(response: { ok: boolean; status?: number; body: unknown }) {
  return vi.fn(async () =>
    new Response(JSON.stringify(response.body), {
      status: response.status ?? (response.ok ? 200 : 400),
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('auth-client', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('returns token and user on successful login', async () => {
      global.fetch = mockFetch({
        ok: true,
        body: { success: true, data: { token: 'abc123', user: { id: 1, name: 'A', email: 'a@b.c' } } },
      });

      const session = await login({ email: 'a@b.c', password: 'pass' });

      expect(session.token).toBe('abc123');
      expect(session.user?.email).toBe('a@b.c');
    });

    it('throws with API error message on 4xx', async () => {
      global.fetch = mockFetch({
        ok: false,
        status: 401,
        body: { success: false, error: { message: 'Identifiants invalides' } },
      });

      await expect(login({ email: 'wrong', password: 'wrong' })).rejects.toThrow('Identifiants invalides');
    });

    it('falls back to default message on malformed error payload', async () => {
      global.fetch = mockFetch({ ok: false, status: 500, body: null });

      await expect(login({ email: 'x', password: 'y' })).rejects.toThrow('Connexion impossible.');
    });
  });

  describe('register', () => {
    it('returns session on success', async () => {
      global.fetch = mockFetch({
        ok: true,
        body: { success: true, data: { token: 'tok', user: { id: 2, name: 'N', email: 'n@e.c' } } },
      });

      const session = await register({ name: 'N', email: 'n@e.c', password: 'p' });

      expect(session.token).toBe('tok');
      expect(session.user?.name).toBe('N');
    });
  });

  describe('me', () => {
    it('sends bearer token in Authorization header', async () => {
      const fetchMock = mockFetch({
        ok: true,
        body: { success: true, data: { user: { id: 1, name: 'A', email: 'a@b.c' } } },
      });
      global.fetch = fetchMock;

      await me('my-token');

      const call = fetchMock.mock.calls[0];
      const init = call[1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBe('Bearer my-token');
    });
  });

  describe('logout', () => {
    it('resolves silently on successful logout', async () => {
      global.fetch = mockFetch({ ok: true, body: { success: true } });

      await expect(logout('token')).resolves.toBeUndefined();
    });

    it('throws on logout error', async () => {
      global.fetch = mockFetch({
        ok: false,
        status: 500,
        body: { error: { message: 'Server boom' } },
      });

      await expect(logout('token')).rejects.toThrow('Server boom');
    });
  });
});
