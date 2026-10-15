import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { ApiClient } from '../src/services/api-client.ts';

const originalFetch = globalThis.fetch;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const json = (data, status = 200) => Response.json(data, { status });
const unauthorized = () => json({ error: { message: 'Access token expired' } }, 401);
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
let client;

beforeEach(() => {
  const values = new Map([['pulse_access_token', 'expired']]);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  });
  client = new ApiClient('/api');
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
});

test('concurrent expired requests share one refresh and preserve request bodies', async () => {
  const gate = deferred();
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(options.credentials, 'include');
    if (url.endsWith('/auth/refresh')) {
      refreshes++;
      await gate.promise;
      return json({ accessToken: 'fresh' });
    }
    if (options.headers.get('Authorization') === 'Bearer expired') return unauthorized();
    assert.equal(options.method, 'PATCH');
    assert.equal(options.body, '{"status":"DONE"}');
    return json({ saved: true });
  };
  const options = { method: 'PATCH', body: '{"status":"DONE"}' };
  const first = client.request('/tasks/1', options);
  const second = client.request('/tasks/2', options);
  await new Promise(setImmediate);
  gate.resolve();
  assert.deepEqual(await Promise.all([first, second]), [{ saved: true }, { saved: true }]);
  assert.equal(refreshes, 1);
  assert.equal(localStorage.getItem('pulse_access_token'), 'fresh');
});

test('a delayed 401 reuses the refreshed token without rotating again', async () => {
  const delayed = deferred();
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/refresh')) {
      refreshes++;
      return json({ accessToken: 'fresh' });
    }
    if (options.headers.get('Authorization') === 'Bearer expired') {
      if (url.endsWith('/slow')) await delayed.promise;
      return unauthorized();
    }
    return json({ ok: true });
  };
  const slow = client.request('/slow');
  await client.request('/fast');
  delayed.resolve();
  await slow;
  assert.equal(refreshes, 1);
});

for (const status of [403, 422, 500]) {
  test(`a ${status} after refreshing preserves the session and original error`, async () => {
    let attempts = 0;
    globalThis.fetch = async (url) => {
      if (url.endsWith('/auth/refresh')) return json({ accessToken: 'fresh' });
      return ++attempts === 1 ? unauthorized() : json({ error: { message: 'Task update failed' } }, status);
    };
    await assert.rejects(client.request('/tasks/1'), { message: 'Task update failed' });
    assert.equal(client.getToken(), 'fresh');
    assert.equal(attempts, 2);
  });
}

test('temporary refresh failures preserve credentials and permit a later refresh', async () => {
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/refresh')) {
      if (++refreshes === 1) throw new TypeError('Network offline');
      return json({ accessToken: 'fresh' });
    }
    return options.headers.get('Authorization') === 'Bearer fresh' ? json({ ok: true }) : unauthorized();
  };
  await assert.rejects(client.request('/tasks'), { message: 'Network offline' });
  assert.equal(client.getToken(), 'expired');
  await client.request('/tasks');
  assert.equal(refreshes, 2);
});

test('refresh rejection clears the token and notifies subscribers', async () => {
  const tokens = [];
  const unsubscribe = client.subscribeToken((token) => tokens.push(token));
  globalThis.fetch = async () => unauthorized();
  await assert.rejects(client.request('/tasks'), { message: 'Access token expired' });
  assert.equal(client.getToken(), null);
  assert.equal(localStorage.getItem('pulse_access_token'), null);
  assert.deepEqual(tokens, [null]);
  unsubscribe();
  client.setToken('another');
  assert.deepEqual(tokens, [null]);
});

test('a retried 401 clears the session without an infinite retry loop', async () => {
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    return url.endsWith('/auth/refresh') ? json({ accessToken: 'fresh' }) : unauthorized();
  };
  await assert.rejects(client.request('/tasks'), { message: 'Access token expired' });
  assert.equal(calls, 3);
  assert.equal(client.getToken(), null);
});

test('successful refresh publishes the new token for socket authentication', async () => {
  const tokens = [];
  client.subscribeToken((token) => tokens.push(token));
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/refresh')) return json({ accessToken: 'fresh' });
    return options.headers.get('Authorization') === 'Bearer fresh' ? json({ ok: true }) : unauthorized();
  };
  await client.request('/tasks');
  assert.deepEqual(tokens, ['fresh']);
});

for (const replacement of [null, 'new-login']) {
  test(`a late refresh cannot overwrite a session changed to ${replacement}`, async () => {
    const gate = deferred();
    globalThis.fetch = async (url) => {
      if (url.endsWith('/auth/refresh')) {
        await gate.promise;
        return json({ accessToken: 'stale-refresh' });
      }
      return unauthorized();
    };
    const request = client.request('/tasks');
    const rejected = assert.rejects(request, { message: 'Session changed while refreshing' });
    await new Promise(setImmediate);
    client.setToken(replacement);
    gate.resolve();
    await rejected;
    assert.equal(client.getToken(), replacement);
  });
}

test('authentication errors are returned without attempting a refresh', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return unauthorized(); };
  await assert.rejects(client.request('/auth/login'), { message: 'Access token expired' });
  assert.equal(calls, 1);
  assert.equal(client.getToken(), 'expired');
});

test('empty successful responses and Headers instances are supported', async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.get('X-Request-ID'), 'test-id');
    return new Response(null, { status: 204 });
  };
  assert.deepEqual(await client.request('/tasks/1', {
    method: 'DELETE', headers: new Headers({ 'X-Request-ID': 'test-id' }),
  }), {});
});

test('malformed refresh responses never store an undefined token', async () => {
  globalThis.fetch = async (url) => url.endsWith('/auth/refresh') ? json({}) : unauthorized();
  await assert.rejects(client.request('/tasks'), { message: 'Invalid token refresh response' });
  assert.equal(client.getToken(), 'expired');
});
