import { AbortError } from '../errors/AbortError.js'

/**
 * Check if an AbortSignal has been aborted and throw AbortError if so
 * @param {AbortSignal} [signal] - The AbortSignal to check
 * @throws {AbortError} - If the signal has been aborted
 */
export function checkAborted(signal) {
  if (signal && signal.aborted) {
    throw new AbortError()
  }
}

/**
 * Create a promise that rejects when the signal is aborted
 * @param {AbortSignal} [signal] - The AbortSignal to listen to
 * @returns {Promise<never>} - A promise that rejects with AbortError when aborted
 */
export function createAbortPromise(signal) {
  if (!signal) {
    // Return a promise that never resolves/rejects if no signal
    return new Promise(() => {})
  }

  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new AbortError())
      return
    }

    const onAbort = () => {
      reject(new AbortError())
    }

    signal.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Race a promise against an abort signal
 * @param {Promise<T>} promise - The promise to race
 * @param {AbortSignal} [signal] - The AbortSignal to race against
 * @returns {Promise<T>} - The result of the promise or AbortError
 * @template T
 */
export function raceWithAbort(promise, signal) {
  if (!signal) {
    return promise
  }

  return Promise.race([promise, createAbortPromise(signal)])
}
