import { problems } from './catalog.mjs';

export const ids = problems.map(problem => problem.id);
const known = new Set(ids);
export const maxNoteLength = 8000;
export const maxBatch = 24;

export function emptyState() {
  return { notes: {}, favorites: [], order: ids.slice() };
}

export function validEdit(edit) {
  if (!edit || !known.has(edit.id) || !/^[0-9a-f-]{36}$/i.test(edit.uid || '')) return false;
  if (edit.kind === 'note') return typeof edit.value === 'string' && edit.value.length <= maxNoteLength;
  if (edit.kind === 'favorite') return typeof edit.value === 'boolean';
  return edit.kind === 'move' && (edit.value === null || (known.has(edit.value) && edit.value !== edit.id));
}

// Replay changes against the latest snapshot. A move is relative to a stable problem ID.
export function applyEdits(base, edits) {
  const state = emptyState();
  state.notes = { ...base?.notes };
  const favorites = new Set((base?.favorites || []).filter(id => known.has(id)));
  state.order = [...new Set([...(base?.order || []).filter(id => known.has(id)), ...ids])];
  for (const edit of edits) {
    if (!validEdit(edit)) continue;
    if (edit.kind === 'note') {
      if (edit.value) state.notes[edit.id] = edit.value;
      else delete state.notes[edit.id];
    } else if (edit.kind === 'favorite') {
      if (edit.value) favorites.add(edit.id);
      else favorites.delete(edit.id);
    } else {
      state.order.splice(state.order.indexOf(edit.id), 1);
      const at = edit.value === null ? state.order.length : state.order.indexOf(edit.value);
      state.order.splice(at, 0, edit.id);
    }
  }
  state.favorites = [...favorites];
  return state;
}
