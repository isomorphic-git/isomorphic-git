var test = require('tape')
  , apply_delta = require('./index')
  , binary = require('bops')

test('test apply delta to buffer', function(assert) {
  var delta = binary.from(fixture.delta, 'base64')
    , base = binary.from(fixture.base, 'base64')
    , expected = fixture.out


  var result = apply_delta(delta, base)

  assert.equal(result.length, binary.from(expected, 'base64').length)
  assert.equal(binary.to(result, 'base64'), expected)

  assert.end()
})

// taken from a `git gc`'d copy of plate
var fixture = {
    "delta":"mwKaApA1KGQyNWNhMjVhYWJmOTkzZTg1MjdkN2I4NGFhNjMxODkxZjJlZWVmNDiRXUAFMDY5NTORokouMDY5NTMzIC0wODAwCgphZGQgYXNzZXJ0LmVuZCgpIHRvIHV0aWxzIHRlc3RzCg=="
  , "base":"dHJlZSA0YWRlOTdjMTgxMjNjNTdhNTBlM2I5OTIzZDA1M2ZkMmRiNGY2MDVmCnBhcmVudCA3N2ZlMTg0OTRiNGI3ZWJmMGVjY2E0ZDBjY2Y4NTA3M2ZiMjFiZGZiCmF1dGhvciBDaHJpcyBEaWNraW5zb24gPGNocmlzdG9waGVyLnMuZGlja2luc29uQGdtYWlsLmNvbT4gMTM1NjY1NDMwMyAtMDgwMApjb21taXR0ZXIgQ2hyaXMgRGlja2luc29uIDxjaHJpc3RvcGhlci5zLmRpY2tpbnNvbkBnbWFpbC5jb20+IDEzNTY2NTQzMDMgLTA4MDAKCmJ1bXAgdmVyc2lvbiBmb3IgY2kudGVzdGxpbmcuY29tCg=="
  , "out":"dHJlZSA0YWRlOTdjMTgxMjNjNTdhNTBlM2I5OTIzZDA1M2ZkMmRiNGY2MDVmCnBhcmVudCBkMjVjYTI1YWFiZjk5M2U4NTI3ZDdiODRhYTYzMTg5MWYyZWVlZjQ4CmF1dGhvciBDaHJpcyBEaWNraW5zb24gPGNocmlzdG9waGVyLnMuZGlja2luc29uQGdtYWlsLmNvbT4gMTM1NjA2OTUzMyAtMDgwMApjb21taXR0ZXIgQ2hyaXMgRGlja2luc29uIDxjaHJpc3RvcGhlci5zLmRpY2tpbnNvbkBnbWFpbC5jb20+IDEzNTYwNjk1MzMgLTA4MDAKCmFkZCBhc3NlcnQuZW5kKCkgdG8gdXRpbHMgdGVzdHMK"
}
