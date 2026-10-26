import { InternalError } from '../errors/InternalError.js'

export class GitRefSpec {
  constructor({ remotePath, localPath, force, matchPrefix, negative = false }) {
    Object.assign(this, {
      remotePath,
      localPath,
      force,
      matchPrefix,
      negative,
    })
  }

  static from(refspec) {
    // A negative refspec like `^refs/heads/tmp/*` excludes the refs it matches,
    // and a refspec without a destination like `refs/heads/main` doesn't store
    // the ref locally.
    if (refspec.startsWith('^') || !refspec.includes(':')) {
      const negative = refspec.startsWith('^')
      const [, forceMatch, remotePath, remoteGlobMatch] = refspec
        .slice(negative ? 1 : 0)
        .match(/^(\+?)(.*?)(\*?)$/)
      return new GitRefSpec({
        remotePath,
        localPath: null,
        force: forceMatch === '+',
        matchPrefix: remoteGlobMatch === '*',
        negative,
      })
    }
    const [forceMatch, remotePath, remoteGlobMatch, localPath, localGlobMatch] =
      refspec.match(/^(\+?)(.*?)(\*?):(.*?)(\*?)$/).slice(1)
    const force = forceMatch === '+'
    const remoteIsGlob = remoteGlobMatch === '*'
    const localIsGlob = localGlobMatch === '*'
    // validate
    // TODO: Make this check more nuanced, and depend on whether this is a fetch refspec or a push refspec
    if (remoteIsGlob !== localIsGlob) {
      throw new InternalError('Invalid refspec')
    }
    return new GitRefSpec({
      remotePath,
      localPath,
      force,
      matchPrefix: remoteIsGlob,
    })
    // TODO: We need to run resolveRef on both paths to expand them to their full name.
  }

  matches(remoteBranch) {
    return this.matchPrefix
      ? remoteBranch.startsWith(this.remotePath)
      : remoteBranch === this.remotePath
  }

  translate(remoteBranch) {
    if (this.localPath === null) return null
    if (this.matchPrefix) {
      if (remoteBranch.startsWith(this.remotePath)) {
        return this.localPath + remoteBranch.replace(this.remotePath, '')
      }
    } else {
      if (remoteBranch === this.remotePath) return this.localPath
    }
    return null
  }

  reverseTranslate(localBranch) {
    if (this.localPath === null) return null
    if (this.matchPrefix) {
      if (localBranch.startsWith(this.localPath)) {
        return this.remotePath + localBranch.replace(this.localPath, '')
      }
    } else {
      if (localBranch === this.localPath) return this.remotePath
    }
    return null
  }
}
