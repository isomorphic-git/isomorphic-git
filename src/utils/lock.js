import AsyncLock from 'async-lock'

// A single process-wide lock shared by everything that serializes file
// operations (the index, refs, the shallow file, blob writes). It is keyed by
// path, so unrelated resources never contend. Centralizing it here also means
// there is exactly one place to reset it (see `_resetLock`).
//
// Created lazily (not at module load) so this module has no top-level side
// effect and stays tree-shakeable.
let lock

function getLock() {
  if (lock === undefined) lock = new AsyncLock({ maxPending: Infinity })
  return lock
}

/**
 * Run `callback` while holding the shared lock for `key`, then release it.
 *
 * @template T
 * @param {string | string[]} key - Resource key(s) to lock (usually a filepath).
 * @param {() => (Promise<T> | T)} callback
 * @returns {Promise<T>}
 */
export function acquireLock(key, callback) {
  return getLock().acquire(key, callback)
}

/**
 * Discard the shared lock so the next `acquireLock` starts a fresh one. Intended
 * for test harnesses that run many independent scenarios inside one long-lived
 * module instance: if a scenario leaves an operation stalled (e.g. a filesystem
 * that hangs), its still-held lock would otherwise block every later scenario
 * that touches the same path. Resetting abandons that stalled queue so the next
 * scenario starts clean. It is a no-op for normal library use.
 */
export function _resetLock() {
  lock = undefined
}
