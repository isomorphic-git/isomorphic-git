// Generates (once, on demand) a self-signed TLS certificate for serving karma
// over HTTPS. Service Workers require a *secure context*; `http://localhost` is
// already secure, so this is only needed if the CI browser reaches karma via a
// non-localhost host over plain HTTP (see test-sw-probe.js for the diagnosis).
//
// Enabled by setting KARMA_HTTPS=1; see karma.conf.cjs. Real BrowserStack /
// SauceLabs browsers additionally need `acceptSslCerts` to trust the self-signed
// cert (also wired up in karma.conf.cjs).
//
// NOTE: over HTTPS, any test that fetches a plain-HTTP resource (the mock git
// server on :8888, the cors-proxy on :9999) would be blocked as mixed content.
// Those suites are being moved to server-only, and the whole point of the SW
// fixtures approach is to remove the cross-origin fixture fetches — but keep this
// caveat in mind when flipping HTTPS on for the full matrix.
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '..', '..', '.https-cert')
const keyPath = path.join(dir, 'key.pem')
const certPath = path.join(dir, 'cert.pem')

function getHttpsServerOptions() {
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    fs.mkdirSync(dir, { recursive: true })
    execFileSync(
      'openssl',
      [
        'req',
        '-x509',
        '-newkey',
        'rsa:2048',
        '-nodes',
        '-keyout',
        keyPath,
        '-out',
        certPath,
        '-days',
        '365',
        '-subj',
        '/CN=localhost',
        '-addext',
        'subjectAltName=DNS:localhost,DNS:bs-local.com,IP:127.0.0.1',
      ],
      { stdio: 'ignore' }
    )
  }
  return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
}

module.exports = { getHttpsServerOptions }
