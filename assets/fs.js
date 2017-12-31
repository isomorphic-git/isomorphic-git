BrowserFS.configure({ fs: 'IndexedDB', options: {} }, function (err) {
  if (err) return console.log(err)
  window.fs = BrowserFS.BFSRequire('fs')
  window.dir = 'tutorial'
})
