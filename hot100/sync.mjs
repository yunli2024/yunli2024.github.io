import { workerOrigin } from './config.mjs';
import { applyEdits, emptyState, maxBatch } from './state.mjs';

const prefix = 'hot100.v1.';
const authKey = prefix + 'session';
const verifierKey = prefix + 'login-verifier';
const api = workerOrigin.replace(/\/+$/, '');
function editId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  // Browsers also allow getRandomValues when previewing a static page over LAN HTTP.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}
const writer = editId();
const memory = new Map();
const events = new EventTarget();
let storageFailed = false;
let busy = false;
let again = false;
let timer;
let message = '';
let lastStamp = 0;

function read(key) {
  if (memory.has(key)) return memory.get(key);
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { storageFailed = true; return null; }
}

function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    memory.delete(key);
  } catch { storageFailed = true; memory.set(key, value); }
}

function pending(scope) {
  const keys = new Set(memory.keys());
  try {
    for (let i = 0; i < localStorage.length; i++) keys.add(localStorage.key(i));
  } catch { storageFailed = true; }
  const start = prefix + scope + '.op.';
  return [...keys].filter(key => key?.startsWith(start)).map(key => ({ key, edit: read(key) }))
    .filter(item => item.edit).sort((a, b) => a.edit.time - b.edit.time || a.edit.uid.localeCompare(b.edit.uid));
}

const session = () => read(authKey);
const active = auth => Boolean(api && auth?.token && auth.expires > Date.now() / 1000);
const scopeOf = auth => auth?.account || 'guest';
const snapshotKey = scope => prefix + scope + '.snapshot';
const emit = () => events.dispatchEvent(new Event('change'));

export function current() {
  const auth = session();
  const scope = scopeOf(auth);
  const edits = pending(scope).map(item => item.edit);
  const stored = read(snapshotKey(scope));
  let status = '仅保存在此浏览器';
  if (!api) status += ' · 云同步待配置';
  else if (auth && !active(auth)) status = '需重新登录同步';
  else if (active(auth)) {
    if (!navigator.onLine) status = '离线 · 待同步';
    else if (edits.length) status = '待同步';
    else if (busy || !stored) status = '正在同步';
    else status = '已同步';
  }
  if (message) status = message;
  if (storageFailed) status += ' · 本机存储不可用';
  return { state: applyEdits(stored?.state || emptyState(), edits), status,
    login: active(auth) ? auth.login : '', configured: Boolean(api) };
}

export const onChange = listener => events.addEventListener('change', listener);

export function edit(kind, id, value) {
  const scope = scopeOf(session());
  const uid = editId();
  lastStamp = Math.max(Date.now(), lastStamp + 1);
  // Replace unfinished typing from this tab, retaining a unique ID for each transmitted version.
  const suffix = kind === 'move' ? uid : writer + '.' + kind + '.' + id;
  write(prefix + scope + '.op.' + suffix, { uid, kind, id, value, time: lastStamp });
  message = '';
  emit();
  schedule(kind === 'note' ? 450 : 0);
}

function schedule(delay = 0) {
  clearTimeout(timer);
  timer = setTimeout(sync, delay);
}

async function request(path, auth, body) {
  const headers = { Accept: 'application/json' };
  if (auth?.token) headers.Authorization = 'Bearer ' + auth.token;
  if (body) headers['Content-Type'] = 'application/json';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const payload = body ? JSON.stringify(body) : undefined;
  try {
    const result = await fetch(api + path, { method: body ? 'POST' : 'GET', headers,
      body: payload, cache: 'no-store', signal: controller.signal,
      keepalive: path === '/state' && Boolean(payload) && new TextEncoder().encode(payload).length <= 60000 });
    if (!result.ok) throw Object.assign(new Error('HTTP ' + result.status), { status: result.status });
    return await result.json();
  } finally { clearTimeout(timeout); }
}

async function sync() {
  const auth = session();
  if (!active(auth) || !navigator.onLine) { emit(); return; }
  if (busy) { again = true; return; }
  busy = true;
  const scope = scopeOf(auth);
  try {
    emit();
    do {
      const batch = pending(scope).slice(0, maxBatch);
      const body = batch.length ? { edits: batch.map(item => item.edit) } : undefined;
      const snapshot = await request('/state', auth, body);
      if (session()?.token !== auth.token) break;
      const key = snapshotKey(scope);
      if (snapshot.revision >= (read(key)?.revision ?? -1)) write(key, snapshot);
      for (const item of batch) {
        if (read(item.key)?.uid === item.edit.uid) write(item.key, null);
      }
      message = '';
      if (!pending(scope).length) break;
    } while (navigator.onLine);
  } catch (error) {
    if (session()?.token === auth.token) {
      if (error.status === 401) {
        write(authKey, { ...auth, token: '', expires: 0 });
        message = '需重新登录同步';
      } else message = '连接失败 · 待同步';
    }
  } finally {
    busy = false;
    emit();
    if (again) { again = false; schedule(); }
  }
}

const base64 = bytes => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

export async function login() {
  if (!api) return;
  try {
    const verifier = base64(crypto.getRandomValues(new Uint8Array(32)));
    sessionStorage.setItem(verifierKey, verifier);
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    location.assign(api + '/auth/start?challenge=' + encodeURIComponent(base64(new Uint8Array(hash))));
  } catch { message = '无法开始登录，请在启用浏览器存储的 HTTPS 页面重试'; emit(); }
}

export async function logout() {
  const auth = session();
  if (!auth) return;
  try {
    if (active(auth)) await request('/logout', auth, {});
    write(authKey, null);
    message = '';
  } catch (error) {
    if (error.status === 401) { write(authKey, null); message = ''; }
    else message = '退出需要联网，请稍后重试';
  }
  emit();
}

function mergeGuest(account) {
  for (const { key, edit: change } of pending('guest')) {
    write(key.replace(prefix + 'guest.op.', prefix + account + '.op.'), change);
    write(key, null);
  }
}

export async function initialize() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (params.has('ticket') || params.has('loginError')) {
    history.replaceState(null, '', location.pathname + location.search);
    try {
      if (params.has('ticket') && api) {
        const verifier = sessionStorage.getItem(verifierKey);
        const auth = await request('/auth/exchange', null, { ticket: params.get('ticket'), verifier });
        sessionStorage.removeItem(verifierKey);
        write(authKey, auth);
        mergeGuest(auth.account);
      } else {
        const errors = { owner: '此账号没有访问个人记录的权限', cancelled: '登录已取消', expired: '登录已过期，请重试' };
        message = errors[params.get('loginError')] || 'GitHub 登录失败，请重试';
      }
    } catch { message = '登录未完成，请重新登录'; }
  }
  // Completing an interrupted guest migration is safe because each edit has a stable receipt.
  if (active(session())) mergeGuest(session().account);
  window.addEventListener('storage', event => {
    if (!event.key?.startsWith(prefix)) return;
    emit();
    if (event.key === authKey || (event.key.includes('.op.') && event.newValue)) schedule(500);
  });
  window.addEventListener('online', () => schedule());
  window.addEventListener('offline', () => { message = ''; emit(); });
  window.addEventListener('focus', () => schedule());
  const flushDraft = () => {
    if (active(session()) && pending(scopeOf(session())).length) {
      clearTimeout(timer);
      sync();
    }
  };
  window.addEventListener('pagehide', flushDraft);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushDraft(); else schedule(); });
  setInterval(() => { if (!document.hidden) schedule(); }, 20000);
  emit();
  schedule();
}
