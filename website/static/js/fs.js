// Initialize isomorphic-git with a file system
window.fs = new LightningFS('fs')
git.plugins.set('fs', window.fs)

// make a Promisified version for convenience
window.pfs = window.fs.promises

window.dir = '/tutorial'
