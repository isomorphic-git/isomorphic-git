class GitSigningHelperPlaceholderImplementation {
  sign () {
    throw new Error('No PGP plugin registered with isomorphic-git')
  }
  listSigningKeys () {
    throw new Error('No PGP plugin registered with isomorphic-git')
  }
  verify () {
    throw new Error('No PGP plugin registered with isomorphic-git')
  }
}

let GitSigningHelper = new GitSigningHelperPlaceholderImplementation()

export class GitSigningManager {
  static getSigningHelper () {
    return GitSigningHelper
  }
  static register (helper) {
    GitSigningHelper = helper
  }
}
