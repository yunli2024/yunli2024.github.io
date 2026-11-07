import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { handle } from './worker.mjs';

const site = 'https://example.github.io/hot100/';
const origin = new URL(site).origin;
const api = 'https://hot100-test.example';
const pkce = async text => Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))).toString('base64url');

function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  return {
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      return { bind(...values) {
        return {
          first: async () => statement.get(...values),
          all: async () => ({ results: statement.all(...values) }),
          run: () => ({ meta: { changes: Number(statement.run(...values).changes) } })
        };
      } };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const results = statements.map(statement => statement.run());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  };
}

function fixture(fetchSource, overrides = {}) {
  const env = { DB: database(), SITE_URL: site, OWNER_GITHUB_ID: '42', GITHUB_CLIENT_ID: 'test-id', GITHUB_CLIENT_SECRET: 'test-secret', ...overrides };
  return async function call(path, { token, body, cookie, requestOrigin = origin, userId = 42 } = {}) {
    const headers = new Headers({ Origin: requestOrigin });
    if (token) headers.set('Authorization', 'Bearer ' + token);
    if (cookie) headers.set('Cookie', cookie);
    if (body) headers.set('Content-Type', 'application/json');
    const request = new Request(api + path, { headers, method: body ? 'POST' : 'GET', body: body ? JSON.stringify(body) : undefined });
    return handle(request, env, async (url, init) => {
      if (url.startsWith('https://raw.githubusercontent.com/')) return fetchSource(url, init);
      if (url.endsWith('/access_token')) {
        assert.ok(JSON.parse(init.body).code_verifier);
        return Response.json({ access_token: 'fake-github-token' });
      }
      assert.equal(init.headers.Authorization, 'Bearer fake-github-token');
      return Response.json({ id: userId, login: 'tester' });
    });
  };
}

async function handoff(call, userId = 42, returnTo, requestOrigin = origin) {
  const verifier = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
  const params = new URLSearchParams({ challenge: await pkce(verifier) });
  if (returnTo) params.set('return_to', returnTo);
  const start = await call('/auth/start?' + params, { requestOrigin });
  assert.equal(start.status, 302);
  const target = new URL(start.headers.get('Location'));
  assert.equal(target.origin, 'https://github.com');
  assert.equal(target.searchParams.get('code_challenge_method'), 'S256');
  const callback = '/auth/callback?state=' + target.searchParams.get('state') + '&code=test';
  const cookie = start.headers.get('Set-Cookie').split(';')[0];
  const finish = await call(callback, { cookie, userId, requestOrigin });
  return { result: new URL(finish.headers.get('Location')), callback, cookie, verifier };
}

async function login(call) {
  const { result, verifier } = await handoff(call);
  const ticket = new URLSearchParams(result.hash.slice(1)).get('ticket');
  const response = await call('/auth/exchange', { body: { ticket, verifier } });
  assert.equal(response.status, 200);
  return (await response.json()).token;
}

const edit = (kind, id, value) => ({ uid: crypto.randomUUID(), kind, id, value });
const push = async (call, token, edits) => {
  const response = await call('/state', { token, body: { edits } });
  assert.equal(response.status, 200);
  return response.json();
};

test('OAuth handoff is origin-bound, browser-bound, owner-only and single-use', async () => {
  const call = fixture();
  assert.equal((await call('/state')).status, 401);
  assert.equal((await call('/state', { requestOrigin: 'https://foreign.example' })).status, 403);
  assert.equal((await handoff(call, 43)).result.hash, '#loginError=owner');
  const { result, callback, cookie, verifier } = await handoff(call);
  const ticket = new URLSearchParams(result.hash.slice(1)).get('ticket');
  assert.equal(result.origin + result.pathname, site);
  assert.ok(ticket);
  assert.equal((await call(callback, { cookie })).headers.get('Location'), site + '#loginError=cancelled');
  assert.equal((await call(callback)).headers.get('Location'), site + '#loginError=expired');
  assert.equal((await call('/auth/exchange', { body: { ticket, verifier: 'a'.repeat(43) } })).status, 401);
  const exchange = () => call('/auth/exchange', { body: { ticket, verifier } });
  const session = await (await exchange()).json();
  assert.equal(session.account, '42');
  assert.equal((await exchange()).status, 401);
  assert.equal((await call('/logout', { token: session.token, body: {} })).status, 200);
  assert.equal((await call('/state', { token: session.token })).status, 401);
});

test('reader entry returns to its own allowed host and rejects arbitrary return addresses', async () => {
  const readerSite = api + '/';
  const call = fixture(undefined, { READER_SITE_URL: readerSite });
  const challenge = 'a'.repeat(43);
  for (const returnTo of ['https://foreign.example/', readerSite + '?next=foreign', site + 'other']) {
    const response = await call('/auth/start?' + new URLSearchParams({ challenge, return_to: returnTo }));
    assert.equal(response.status, 400);
  }
  const { result, verifier } = await handoff(call, 42, readerSite, api);
  assert.equal(result.origin + result.pathname, readerSite);
  const ticket = new URLSearchParams(result.hash.slice(1)).get('ticket');
  const session = await (await call('/auth/exchange', { requestOrigin: api, body: { ticket, verifier } })).json();
  for (const requestOrigin of [origin, api]) {
    const response = await call('/state', { token: session.token, requestOrigin });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), requestOrigin);
  }
  assert.equal((await handoff(call, 43, readerSite, api)).result.href, readerSite + '#loginError=owner');
  const start = await call('/auth/start?' + new URLSearchParams({ challenge, return_to: readerSite }), { requestOrigin: api });
  const target = new URL(start.headers.get('Location'));
  const cancelled = await call('/auth/callback?state=' + target.searchParams.get('state'), {
    requestOrigin: api, cookie: start.headers.get('Set-Cookie').split(';')[0]
  });
  assert.equal(cancelled.headers.get('Location'), readerSite + '#loginError=cancelled');

  const db = database();
  const legacy = fixture(undefined, { DB: db, READER_SITE_URL: readerSite });
  const pending = await legacy('/auth/start?challenge=' + challenge);
  await db.prepare('UPDATE login_attempts SET return_to = NULL WHERE state = ?')
    .bind(new URL(pending.headers.get('Location')).searchParams.get('state')).run();
  const finish = await legacy('/auth/callback?state=' + new URL(pending.headers.get('Location')).searchParams.get('state') + '&code=test', {
    cookie: pending.headers.get('Set-Cookie').split(';')[0]
  });
  assert.equal(new URL(finish.headers.get('Location')).origin + new URL(finish.headers.get('Location')).pathname, site);
});

test('static reader assets are public while statements and progress stay authenticated', async () => {
  const assetPaths = [];
  const call = fixture(undefined, { READER_SITE_URL: api + '/', ASSETS: {
    async fetch(request) {
      assetPaths.push(new URL(request.url).pathname);
      return new Response('<html>Reader</html>', { headers: { 'Content-Type': 'text/html' } });
    }
  } });
  const response = await call('/', { requestOrigin: api });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'text/html');
  assert.equal(await response.text(), '<html>Reader</html>');
  assert.equal((await call('/statements/1', { requestOrigin: api })).status, 401);
  assert.equal((await call('/state', { requestOrigin: api })).status, 401);
  assert.equal((await call('/state', { requestOrigin: 'https://foreign.example' })).status, 403);
  assert.deepEqual(assetPaths, ['/']);
});

test('two device sessions merge changes, retries do not replay an obsolete edit', async () => {
  const call = fixture();
  const laptop = await login(call);
  const phone = await login(call);
  const note = edit('note', 1, '先检查补数');
  const move = edit('move', 287, 1);
  await Promise.all([push(call, laptop, [note, move]), push(call, phone, [edit('favorite', 1, true)])]);
  const read = async token => (await call('/state', { token })).json();
  const merged = await read(phone);
  assert.equal(merged.state.notes[1], '先检查补数');
  assert.deepEqual(merged.state.favorites, [1]);
  assert.deepEqual(merged.state.order.slice(0, 3), [287, 1, 49]);
  assert.equal(new Set(merged.state.order).size, 100);
  await push(call, phone, [edit('note', 1, '手机更新'), edit('move', 287, null)]);
  const newer = await read(phone);
  assert.deepEqual(await push(call, laptop, [note, move]), newer);
  assert.equal(newer.state.notes[1], '手机更新');
  assert.equal(newer.state.order.at(-1), 287);
  assert.deepEqual(await read(laptop), newer);
  assert.equal((await call('/state', { token: phone, body: { edits: [edit('move', 1, 1)] } })).status, 400);
});

const originalHtml = '<p>这是用于验证完整题面读取的中文测试数据，文字与空格应保留原样。</p>\n<pre>input = [4, 1, 6]\noutput = 2</pre><p>约束为 10<sup>4</sup>，这是测试条件。</p>';
const sourceDocument = '# [1. Test](https://leetcode.cn/problems/two-sum/)\n' +
  '<!-- description:start -->\n' + originalHtml + '\n<!-- description:end -->\n## Solution\nPRIVATE_SOLUTION_MUST_NOT_APPEAR';

test('original statements require login, keep text intact, exclude solutions and cache privately', async () => {
  let requests = 0;
  const call = fixture(async url => {
    requests++;
    assert.match(url, /0001\.Two%20Sum\/README\.md$/);
    return new Response(sourceDocument);
  });
  assert.equal((await call('/statements/1')).status, 401);
  assert.equal(requests, 0);
  const token = await login(call);
  const response = await call('/statements/1', { token });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const record = await response.json();
  assert.equal(record.html, originalHtml);
  assert.equal(record.id, 1);
  assert.equal(record.language, 'zh-CN');
  assert.match(record.sourceUrl, /^https:\/\/github\.com\/doocs\/leetcode\/blob\//);
  assert.equal(record.license, 'CC BY-SA 4.0');
  assert.equal(record.html.includes('PRIVATE_SOLUTION'), false);
  assert.deepEqual(await (await call('/statements/1', { token })).json(), record);
  assert.equal(requests, 1);
  assert.equal((await call('/statements/9999', { token })).status, 404);
  assert.equal((await call('/statements/1?language=en', { token })).status, 400);
  assert.equal((await call('/statements/1', { token, body: {} })).status, 405);
  await call('/logout', { token, body: {} });
  assert.equal((await call('/statements/1', { token })).status, 401);
});

test('source failures and incomplete descriptions remain retryable', async () => {
  let source = 'An incomplete upstream response';
  let requests = 0;
  const call = fixture(async () => { requests++; return new Response(source); });
  const token = await login(call);
  assert.equal((await call('/statements/1', { token })).status, 503);
  source = sourceDocument;
  assert.equal((await call('/statements/1', { token })).status, 200);
  assert.equal(requests, 2);
});
