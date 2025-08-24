import { GitRefSpec } from './GitRefSpec'

export class GitRefSpecSet {
  constructor(rules = []) {
    this.rules = rules
  }

  static from(refspecs) {
    const rules = []
    for (const refspec of refspecs) {
      rules.push(GitRefSpec.from(refspec)) // might throw
    }
    return new GitRefSpecSet(rules)
  }

  add(refspec) {
    const rule = GitRefSpec.from(refspec) // might throw
    this.rules.push(rule)
  }

  translate(remoteRefs) {
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

  translateOne(remoteRef) {
    let result = null
    for (const rule of this.rules) {
      const localRef = rule.translate(remoteRef)
      if (localRef) {
        result = localRef
      }
    }
    return result
  }

  localNamespaces() {
    return this.rules
      .filter(rule => rule.matchPrefix)
      .map(rule => rule.localPath.replace(/\/$/, ''))
  }
}
