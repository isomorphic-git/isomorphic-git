export class ProcessMap {
  constructor () {
    this._map = new Map()
  }

  /**
   *
   * @param {string} processId
   */
  abort (processId) {
    const callbacks = this._map.get(processId)
    this._map.set(processId, false)
    if (callbacks) for (const handler of callbacks) handler({ processId })
  }

  /**
   *
   * @param {string} processId
   * @param {Function} callback
   */
  registerAbortCallback (processId, callback) {
    const callbacks = this._map.has(processId) ? this._map.get(processId) : []
    if (callbacks === false) {
      const e = new Error()
      e.name = 'AbortError'
      throw e
    }
    callbacks.push(callback)
    this._map.set(processId, callbacks)
  }

  /**
   *
   * @param {string} processId
   */
  unregister (processId) {
    this._map.delete(processId)
  }
}
