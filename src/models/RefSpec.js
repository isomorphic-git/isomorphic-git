export class RefSpec {
  constructor ({ remotePath, localPath, force, matchPrefix }) {
    Object.assign(this, {
      remotePath,
      localPath,
      force,
      matchPrefix
    })
  }
  static from (refspec) {
    const [
      forceMatch,
      remotePath,
      remoteGlobMatch,
      localPath,
      localGlobMatch
    ] = refspec.match(/^(\+?)(.*?)(\*?):(.*?)(\*?)$/).slice(1)
    const force = forceMatch === '+'
    const remoteIsGlob = remoteGlobMatch === '*'
    const localIsGlob = localGlobMatch === '*'
    // validate
    // TODO: Make this check more nuanced, and depend on whether this is a fetch refspec or a push refspec
    if (remoteIsGlob !== localIsGlob) throw new Error('Invalid refspec')
    return new RefSpec({
      remotePath,
      localPath,
      force,
      matchPrefix: remoteIsGlob
    })
    // TODO: We need to run resolveRef on both paths to expand them to their full name.
  }
  translate (remoteBranch) {
    if (this.matchPrefix) {
      if (remoteBranch.startsWith(this.remotePath)) {
        return this.localPath + remoteBranch.replace(this.remotePath, '')
      }
    } else {
      if (remoteBranch === this.remotePath) return this.localPath
    }
    return null
  }
}

export class RefSpecSet {
  constructor () {
    this.rules = []
  }
  add (refspec) {
    const rule = RefSpec.from(refspec) // might throw
    this.rules.push(rule)
  }
  translate (remoteRefs) {
    const result = []
    for (const rule of this.rules) {
      for (const remoteRef of remoteRefs) {
        const localRef = rule.translate(remoteRef)
        if (localRef) {
          result.push([remoteRef, localRef])
        }
      }
    }
    return result
  }
}
