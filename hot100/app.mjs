import { problems } from './catalog.mjs';
import { maxNoteLength } from './state.mjs';
import { current, edit, initialize, login, logout, onChange } from './sync.mjs';

const list = document.querySelector('#problems');
const template = document.querySelector('#problem-template');
const tabs = [...document.querySelectorAll('[data-view]')];
const rows = new Map();
let view = 'official';
let opened = null;
let dragging = false;
let justDropped = null;
let statements;
let sortable;

const sourceOf = problem => 'https://leetcode.cn/problems/' + problem.slug + '/description/';
const announce = message => { document.querySelector('#announcement').textContent = message; };

function disclose(button, panel, open) {
  button.setAttribute('aria-expanded', String(open));
  panel.hidden = !open;
}

function closeProblem() {
  if (!opened) return;
  const row = rows.get(opened);
  disclose(row.querySelector('.title-button'), row.querySelector('.details'), false);
  disclose(row.querySelector('.hint-toggle'), row.querySelector('.hint'), false);
  disclose(row.querySelector('.notes-toggle'), row.querySelector('.notes'), false);
  opened = null;
}

const allowedTags = new Set('p div span pre code strong b em i sup sub br hr a img ul ol li table thead tbody tr th td h2 h3 h4 blockquote dl dt dd'.split(' '));
const discardTags = new Set('script style iframe object template svg form'.split(' '));

// Keep the supplied text verbatim. Recreate only supported formatting in the active document.
function safeContent(html, url) {
  const template = document.createElement('template');
  template.innerHTML = html;
  function copy(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE || discardTags.has(node.localName)) return document.createDocumentFragment();
    const tag = node.localName;
    const result = allowedTags.has(tag) ? document.createElement(tag) : document.createDocumentFragment();
    if (tag === 'a' || tag === 'img') {
      const attr = tag === 'a' ? 'href' : 'src';
      const input = node.getAttribute(attr);
      try {
        const resource = new URL(input, url);
        if (input && resource.protocol === 'https:') result.setAttribute(attr, resource.href);
      } catch { /* Keep the text if a resource URL is malformed. */ }
      if (tag === 'a') { result.target = '_blank'; result.rel = 'noopener noreferrer'; }
      else { result.alt = node.getAttribute('alt') || '题目配图'; result.loading = 'lazy'; }
    }
    for (const child of node.childNodes) result.append(copy(child));
    return result;
  }
  const result = document.createDocumentFragment();
  for (const node of template.content.childNodes) result.append(copy(node));
  return result;
}

async function showStatement(row, problem) {
  const panel = row.querySelector('.statement');
  if (panel.dataset.ready) return;
  panel.textContent = '正在读取题面…';
  if (!statements) statements = fetch('./statements.zh-CN.json').then(response => {
    if (!response.ok) throw new Error('题面文件暂时无法读取');
    return response.json();
  });
  let html;
  let failed = false;
  try { html = (await statements)[problem.id]; }
  catch { statements = null; failed = true; }
  const url = sourceOf(problem);
  if (typeof html === 'string' && html.trim()) {
    panel.replaceChildren(safeContent(html, url));
  } else {
    const link = document.createElement('a');
    link.className = 'read-link';
    link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = '在力扣阅读完整中文原文 ↗';
    panel.replaceChildren(link);
    if (failed) panel.prepend(document.createTextNode('题面文件暂时无法读取。'));
  }
  if (!failed) panel.dataset.ready = 'true';
}

function createRow(problem) {
  const row = template.content.firstElementChild.cloneNode(true);
  row.dataset.id = problem.id;
  row.querySelector('.problem-number').textContent = '#' + problem.id;
  row.querySelector('.problem-name').textContent = problem.title;
  const title = row.querySelector('.title-button');
  const body = row.querySelector('.details');
  body.id = 'question-' + problem.id;
  title.setAttribute('aria-controls', body.id);
  title.addEventListener('click', event => {
    if (dragging || (event.detail && justDropped === problem.id)) return;
    const open = opened !== problem.id;
    closeProblem();
    if (!open) return;
    opened = problem.id;
    disclose(title, body, true);
    showStatement(row, problem);
  });
  const original = row.querySelector('.original');
  original.href = sourceOf(problem);
  original.setAttribute('aria-label', '在力扣打开《' + problem.title + '》');
  row.querySelector('.star').addEventListener('click', event => {
    const selected = event.currentTarget.getAttribute('aria-pressed') === 'true';
    edit('favorite', problem.id, !selected);
    if (!row.isConnected) tabs.find(tab => tab.dataset.view === view).focus();
  });
  for (const type of ['hint', 'notes']) {
    const button = row.querySelector('.' + type + '-toggle');
    const panel = row.querySelector('.' + type);
    panel.id = type + '-' + problem.id;
    button.setAttribute('aria-controls', panel.id);
    button.addEventListener('click', () => {
      disclose(button, panel, panel.hidden);
      if (type === 'notes' && !panel.hidden) row.querySelector('textarea').focus();
    });
  }
  row.querySelector('.hint').textContent = problem.hint;
  const note = row.querySelector('textarea');
  note.maxLength = maxNoteLength;
  note.addEventListener('input', () => edit('note', problem.id, note.value));
  return row;
}

function render() {
  const { state, status, login: account, configured } = current();
  document.querySelector('#sync-status').textContent = status;
  const accountButton = document.querySelector('#account-button');
  accountButton.textContent = account ? account + ' · 退出' : 'GitHub 登录';
  accountButton.disabled = !configured;
  if (dragging) return;
  const favorites = new Set(state.favorites);
  const order = view === 'official' ? problems.map(problem => problem.id) : state.order;
  const visible = view === 'favorites' ? order.filter(id => favorites.has(id)) : order;
  const included = new Set(visible);
  if (opened && !included.has(opened)) closeProblem();
  for (const row of [...list.children]) if (!included.has(Number(row.dataset.id))) row.remove();
  for (const [index, id] of visible.entries()) {
    const row = rows.get(id);
    if (list.children[index] !== row) list.insertBefore(row, list.children[index] || null);
    const star = row.querySelector('.star');
    const selected = favorites.has(id);
    if (star.getAttribute('aria-pressed') !== String(selected) || !star.hasAttribute('aria-label')) {
      star.setAttribute('aria-pressed', String(selected));
      star.setAttribute('aria-label', (selected ? '取消收藏' : '收藏') + row.querySelector('.problem-name').textContent);
      star.firstElementChild.textContent = selected ? '★' : '☆';
    }
    const note = row.querySelector('textarea');
    if (note.value !== (state.notes[id] || '')) note.value = state.notes[id] || '';
  }
  for (const tab of tabs) tab.setAttribute('aria-pressed', String(tab.dataset.view === view));
  const personal = view === 'personal';
  sortable?.option('disabled', !personal);
  list.classList.toggle('is-sortable', personal);
  document.querySelector('#star-count').textContent = favorites.size;
  document.querySelector('#list-count').textContent = visible.length + ' 道题';
  document.querySelector('#empty').hidden = visible.length !== 0;
  document.querySelector('#drag-help').hidden = !personal;
}

for (const problem of problems) rows.set(problem.id, createRow(problem));
for (const tab of tabs) tab.addEventListener('click', () => {
  closeProblem();
  view = tab.dataset.view;
  render();
});
document.querySelector('#account-button').addEventListener('click', () => current().login ? logout() : login());

if (window.Sortable) {
  sortable = new window.Sortable(list, {
    disabled: true, draggable: '.problem', direction: 'vertical',
    filter: '.action, a, .details', preventOnFilter: false,
    animation: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 165,
    // Native touchmove can take over after a long press without disabling ordinary vertical swipes.
    supportPointer: false, easing: 'cubic-bezier(.2,.7,.3,1)', forceFallback: true, fallbackOnBody: true,
    delayOnTouchOnly: true, delay: 200, touchStartThreshold: 5, fallbackTolerance: 4,
    scroll: true, bubbleScroll: true, scrollSensitivity: 76, scrollSpeed: 14,
    ghostClass: 'drag-slot', fallbackClass: 'drag-float',
    onStart() { dragging = true; },
    onEnd(event) {
      dragging = false;
      justDropped = Number(event.item.dataset.id);
      if (event.oldIndex !== event.newIndex) {
        const next = event.item.nextElementSibling;
        edit('move', Number(event.item.dataset.id), next ? Number(next.dataset.id) : null);
        announce('已移到第 ' + (event.newIndex + 1) + ' 位');
      } else render();
    }
  });
}

list.addEventListener('pointerdown', () => { justDropped = null; }, true);
list.addEventListener('keydown', event => {
  if (view !== 'personal' || !event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)
    || !event.target.matches('.title-button')) return;
  event.preventDefault();
  const id = Number(event.target.closest('.problem').dataset.id);
  const order = current().state.order;
  const at = order.indexOf(id);
  const next = at + (event.key === 'ArrowUp' ? -1 : 1);
  if (next < 0 || next >= order.length) return;
  edit('move', id, next < at ? order[next] : order[next + 1] ?? null);
  rows.get(id).querySelector('.title-button').focus();
  announce('已移到第 ' + (next + 1) + ' 位');
});

onChange(render);
render();
initialize();
