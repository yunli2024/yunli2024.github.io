import { applyEdits, emptyState, maxBatch, validEdit } from '../../hot100/state.mjs';
import { readStatement } from './statements.mjs';

const seconds = () => Math.floor(Date.now() / 1000);
const encoder = new TextEncoder();
const base64url = bytes => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
const secret = () => base64url(crypto.getRandomValues(new Uint8Array(32)));
const digest = async text => base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text))));
const tokenShape = /^[A-Za-z0-9_-]{43}$/;
const json = (data, status = 200) => Response.json(data, { status });

function redirect(url, cookie) {
  const headers = new Headers({ Location: url });
  if (cookie) headers.set('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers });
}

function stateCookie(url, value, ttl) {
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return 'hot100_oauth=' + value + '; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=' + ttl + secure;
}

async function startLogin(url, env) {
  const challenge = url.searchParams.get('challenge') || '';
  if (!tokenShape.test(challenge)) return json({ error: 'Invalid browser challenge' }, 400);
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !/^\d+$/.test(env.OWNER_GITHUB_ID)) {
    return json({ error: 'GitHub 登录尚未配置完成' }, 503);
  }
  const state = secret();
  const verifier = secret();
  const now = seconds();
  await env.DB.batch([
    ...['login_attempts', 'login_tickets', 'sessions'].map(table =>
      env.DB.prepare('DELETE FROM ' + table + ' WHERE expires <= ?').bind(now)),
    env.DB.prepare('INSERT INTO login_attempts VALUES (?, ?, ?, ?)').bind(state, verifier, challenge, now + 600)
  ]);
  const target = new URL('https://github.com/login/oauth/authorize');
  target.search = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID, redirect_uri: url.origin + '/auth/callback',
    state, code_challenge: await digest(verifier), code_challenge_method: 'S256'
  });
  return redirect(target.href, stateCookie(url, state, 600));
}

async function callback(request, url, env, githubFetch) {
  const finish = (key, value) => {
    const target = new URL(env.SITE_URL);
    target.hash = new URLSearchParams({ [key]: value }).toString();
    return redirect(target.href, stateCookie(url, '', 0));
  };
  const state = url.searchParams.get('state');
  const cookie = (request.headers.get('Cookie') || '').split(/;\s*/).find(part => part.startsWith('hot100_oauth='));
  if (!tokenShape.test(state || '') || cookie !== 'hot100_oauth=' + state) return finish('loginError', 'expired');
  const attempt = await env.DB.prepare('DELETE FROM login_attempts WHERE state = ? AND expires > ? RETURNING *')
    .bind(state, seconds()).first();
  if (!attempt || !url.searchParams.get('code')) return finish('loginError', 'cancelled');
  try {
    const tokenResponse = await githubFetch('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET,
        code: url.searchParams.get('code'), redirect_uri: url.origin + '/auth/callback', code_verifier: attempt.verifier })
    });
    const token = (await tokenResponse.json()).access_token;
    if (!tokenResponse.ok || !token) return finish('loginError', 'failed');
    const userResponse = await githubFetch('https://api.github.com/user', {
      headers: { Authorization: 'Bearer ' + token, 'User-Agent': 'hot100-review', Accept: 'application/vnd.github+json' }
    });
    if (!userResponse.ok) return finish('loginError', 'failed');
    const user = await userResponse.json();
    if (String(user.id) !== env.OWNER_GITHUB_ID) return finish('loginError', 'owner');
    const ticket = secret();
    await env.DB.prepare('INSERT INTO login_tickets VALUES (?, ?, ?, ?, ?)')
      .bind(await digest(ticket), attempt.challenge, String(user.id), user.login, seconds() + 120).run();
    return finish('ticket', ticket);
  } catch {
    return finish('loginError', 'failed');
  }
}

async function exchange(body, env) {
  if (!tokenShape.test(body?.ticket || '') || !tokenShape.test(body?.verifier || '')) return json({ error: 'Invalid handoff' }, 400);
  const ticket = await env.DB.prepare(
    'DELETE FROM login_tickets WHERE digest = ? AND challenge = ? AND expires > ? RETURNING account, login'
  ).bind(await digest(body.ticket), await digest(body.verifier), seconds()).first();
  if (!ticket || ticket.account !== env.OWNER_GITHUB_ID) return json({ error: 'Expired handoff' }, 401);
  const token = secret();
  const expires = seconds() + 30 * 24 * 3600;
  await env.DB.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?)').bind(await digest(token), ticket.account, ticket.login, expires).run();
  return json({ token, account: ticket.account, login: ticket.login, expires });
}

async function snapshot(db, account) {
  const row = await db.prepare('SELECT revision, document FROM progress WHERE account = ?').bind(account).first();
  return { revision: row.revision, state: JSON.parse(row.document) };
}

async function saveEdits(db, account, edits) {
  if (!Array.isArray(edits) || !edits.length || edits.length > maxBatch || !edits.every(validEdit)
    || new Set(edits.map(edit => edit.uid)).size !== edits.length) return json({ error: 'Invalid edits' }, 400);
  const markers = edits.map(() => '?').join(',');
  for (let attempt = 0; attempt < 5; attempt++) {
    const base = await snapshot(db, account);
    const found = await db.prepare('SELECT uid FROM applied_edits WHERE account = ? AND uid IN (' + markers + ')')
      .bind(account, ...edits.map(edit => edit.uid)).all();
    const seen = new Set(found.results.map(row => row.uid));
    const fresh = edits.filter(edit => !seen.has(edit.uid));
    if (!fresh.length) return json(await snapshot(db, account));
    const next = applyEdits(base.state, fresh);
    const writeId = crypto.randomUUID();
    // Receipts and the snapshot commit in one transaction; a lost response can be retried.
    const [write] = await db.batch([
      db.prepare('UPDATE progress SET document = ?, revision = revision + 1, write_id = ? WHERE account = ? AND revision = ?')
        .bind(JSON.stringify(next), writeId, account, base.revision),
      ...fresh.map(edit => db.prepare('INSERT INTO applied_edits (account, uid) SELECT account, ? FROM progress WHERE account = ? AND write_id = ?')
        .bind(edit.uid, account, writeId))
    ]);
    if (write.meta.changes === 1) return json({ revision: base.revision + 1, state: next });
  }
  return json({ error: 'Concurrent edit; retry' }, 409);
}

async function readBody(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return null;
  const buffer = await request.text();
  if (buffer.length > 300000) return null;
  try { return JSON.parse(buffer); } catch { return null; }
}

async function route(request, env, upstreamFetch) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(env.SITE_URL).origin) return json({ error: 'Origin denied' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method === 'GET' && url.pathname === '/auth/start') return startLogin(url, env);
  if (request.method === 'GET' && url.pathname === '/auth/callback') return callback(request, url, env, upstreamFetch);
  if (request.method === 'POST' && url.pathname === '/auth/exchange') return exchange(await readBody(request), env);
  const statement = url.pathname.match(/^\/statements\/(\d+)$/);
  if (!['/state', '/logout'].includes(url.pathname) && !statement) return json({ error: 'Not found' }, 404);
  const token = (request.headers.get('Authorization') || '').match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  if (!token) return json({ error: 'Login required' }, 401);
  const key = await digest(token);
  const session = await env.DB.prepare('SELECT account FROM sessions WHERE digest = ? AND expires > ?').bind(key, seconds()).first();
  if (!session || session.account !== env.OWNER_GITHUB_ID) return json({ error: 'Login required' }, 401);
  if (statement) {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    if (url.searchParams.has('language') && url.searchParams.get('language') !== 'zh-CN') {
      return json({ error: '暂未提供此语言的题面' }, 400);
    }
    return readStatement(env.DB, session.account, Number(statement[1]), upstreamFetch);
  }
  if (url.pathname === '/logout' && request.method === 'POST') {
    await env.DB.prepare('DELETE FROM sessions WHERE digest = ?').bind(key).run();
    return json({ ok: true });
  }
  if (url.pathname !== '/state' || !['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);
  await env.DB.prepare('INSERT OR IGNORE INTO progress (account, document) VALUES (?, ?)')
    .bind(session.account, JSON.stringify(emptyState())).run();
  if (request.method === 'GET') return json(await snapshot(env.DB, session.account));
  return saveEdits(env.DB, session.account, (await readBody(request))?.edits);
}

export async function handle(request, env, upstreamFetch = fetch) {
  let response;
  try { response = await route(request, env, upstreamFetch); }
  catch { response = json({ error: '服务暂时不可用，请稍后重试' }, 503); }
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Vary', 'Origin');
  const origin = request.headers.get('Origin');
  if (origin && origin === new URL(env.SITE_URL).origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  return response;
}

export default { fetch: (request, env) => handle(request, env) };
