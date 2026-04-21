/**
 * In-memory cache for faculty portal data. Avoids blank loading states when
 * faculty navigate between My Classes, Schedule, Instruction, etc.
 */
const store = new Map();

export function readFacultyCache(key) {
  return store.get(key) ?? null;
}

export function writeFacultyCache(key, value) {
  store.set(key, value);
}

export function clearFacultyCache(key) {
  store.delete(key);
}
