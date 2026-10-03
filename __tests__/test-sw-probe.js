/* eslint-env browser, jasmine */
// Diagnostic probe (browser-only) — see also __helpers__/sw-probe.js.
//
// It answers the question that decides whether the Service-Worker fixtures
// approach is viable in CI: on each real browser (reached through the
// BrowserStack / SauceLabs tunnel), is the page a *secure context* so a Service
// Worker can register, and can that worker actually intercept requests?
//
// Everything is logged with a [SW-PROBE] prefix (grep the CI logs) and the spec
// ALWAYS passes — this is a report, not a gate.

const log = (...args) => {
  // console.warn is captured by karma even at higher log levels and is not
  // treated as a failure, so the report reliably reaches the CI stdout.
  // eslint-disable-next-line no-console
  console.warn('[SW-PROBE]', ...args)
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_resolve, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms
      )
    ),
  ])
}

describe('service worker probe', () => {
  it('reports the karma host / secure context and tries to register + intercept', async () => {
    // No-op under Jest/Node: this only makes sense in a real browser.
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      expect(true).toBe(true)
      return
    }

    try {
      log('userAgent      =', navigator.userAgent)
      log('href           =', window.location.href)
      log('origin         =', window.location.origin)
      log('protocol       =', window.location.protocol)
      log('hostname       =', window.location.hostname)
      log('isSecureContext=', window.isSecureContext)
      log('SW supported   =', 'serviceWorker' in navigator)
    } catch (err) {
      log('environment read FAILED:', err && err.message)
    }

    if (!('serviceWorker' in navigator)) {
      log('RESULT: service workers are NOT supported on this browser')
      expect(true).toBe(true)
      return
    }

    // Registered at the origin root (see karma proxy) so scope is '/'.
    const swUrl = '/sw-probe.js'
    let registration
    try {
      registration = await withTimeout(
        navigator.serviceWorker.register(swUrl),
        15000,
        'register'
      )
      log('register OK; scope =', registration.scope)
    } catch (err) {
      log('register FAILED:', err && err.name, '-', err && err.message)
      log(
        'RESULT: registration failed — likely NOT a secure context; HTTPS (KARMA_HTTPS=1) may be required'
      )
      expect(true).toBe(true)
      return
    }

    try {
      await withTimeout(navigator.serviceWorker.ready, 15000, 'ready')
      log(
        'ready OK; controller =',
        navigator.serviceWorker.controller ? 'present' : 'null'
      )
    } catch (err) {
      log('ready FAILED:', err && err.message)
    }

    // claim() may take a tick to take control of this already-loaded page.
    if (!navigator.serviceWorker.controller) {
      try {
        await withTimeout(
          new Promise(resolve =>
            navigator.serviceWorker.addEventListener(
              'controllerchange',
              resolve,
              {
                once: true,
              }
            )
          ),
          5000,
          'controllerchange'
        )
      } catch (err) {
        log('did not become controlled:', err && err.message)
      }
    }
    log(
      'controller after wait =',
      navigator.serviceWorker.controller ? 'present' : 'null'
    )

    // Prove the worker can intercept a request issued from this page.
    try {
      const res = await withTimeout(
        fetch('/__sw_probe_ping__'),
        10000,
        'ping fetch'
      )
      const body = await res.text()
      log('intercept ping -> status', res.status, 'body', JSON.stringify(body))
      log(
        'RESULT: interception',
        body === 'pong-from-sw'
          ? 'WORKS — the worker served the request'
          : 'did NOT work — request fell through to the network'
      )
    } catch (err) {
      log('ping fetch FAILED:', err && err.message)
    }

    // Clean up so the probe worker never lingers into other specs.
    try {
      await registration.unregister()
      log('unregister OK')
    } catch (err) {
      log('unregister FAILED:', err && err.message)
    }

    expect(true).toBe(true)
  })
})
