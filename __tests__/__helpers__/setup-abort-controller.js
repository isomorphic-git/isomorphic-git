/* eslint-env node, browser, jest, jasmine */
// @ts-nocheck

// Polyfill for AbortController in environments that don't support it
// This includes older browsers and potentially some test environments
if (typeof AbortController === 'undefined') {
  class AbortSignal {
    constructor() {
      this.aborted = false
      this.reason = undefined
      this.onabort = null
      this._listeners = []
    }

    addEventListener(type, listener, options) {
      if (type === 'abort') {
        this._listeners.push({ listener, options })
        // If already aborted and listener wants to be called only once
        if (this.aborted && options && options.once) {
          setTimeout(() => listener(), 0)
        }
      }
    }

    removeEventListener(type, listener) {
      if (type === 'abort') {
        this._listeners = this._listeners.filter(l => l.listener !== listener)
      }
    }

    dispatchEvent(event) {
      if (event.type === 'abort') {
        this._listeners.forEach(({ listener, options }) => {
          try {
            listener(event)
          } catch (e) {
            // Ignore listener errors to prevent breaking other listeners
            console.warn('AbortSignal listener error:', e)
          }
          if (options && options.once) {
            this.removeEventListener('abort', listener)
          }
        })
        if (this.onabort) {
          this.onabort(event)
        }
      }
      return true
    }

    throwIfAborted() {
      if (this.aborted) {
        throw new Error('AbortError')
      }
    }

    _abort(reason) {
      if (this.aborted) return
      this.aborted = true
      this.reason = reason
      const event = { type: 'abort', target: this }
      this.dispatchEvent(event)
    }

    static abort(reason) {
      const signal = new AbortSignal()
      signal._abort(reason)
      return signal
    }

    static any(signals) {
      const signal = new AbortSignal()
      const abortHandler = () => signal._abort()
      signals.forEach(s => {
        if (s.aborted) {
          signal._abort()
        } else {
          s.addEventListener('abort', abortHandler)
        }
      })
      return signal
    }

    static timeout(milliseconds) {
      const signal = new AbortSignal()
      setTimeout(() => signal._abort(), milliseconds)
      return signal
    }
  }

  class AbortController {
    constructor() {
      this.signal = new AbortSignal()
    }

    abort(reason) {
      this.signal._abort(reason)
    }
  }

  // Set up globals for both Node.js and browser environments
  if (typeof global !== 'undefined') {
    global.AbortController = AbortController
    global.AbortSignal = AbortSignal
  }
  if (typeof window !== 'undefined') {
    window.AbortController = AbortController
    window.AbortSignal = AbortSignal
  }
  if (typeof self !== 'undefined') {
    self.AbortController = AbortController
    self.AbortSignal = AbortSignal
  }
}

// Export to make this file a module for TypeScript
export {}
