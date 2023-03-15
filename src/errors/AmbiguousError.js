import { BaseError } from './BaseError.js'

export class AmbiguousError extends BaseError {
  /**
   * @param {'oids'|'refs'} nouns
   * @param {string} short
   * @param {string[]} matches
   */
  constructor(nouns, short, matches) {
    super(
      `Found multiple ${nouns} matching "${short}" (${matches.join(
        ', '
      )}). Use a longer abbreviation length to disambiguate them.`
    )
    this.code = this.name = AmbiguousError.code
    this.data = { nouns, short, matches }
  }
}
/** @type {'AmbiguousError'} */
AmbiguousError.code = 'AmbiguousError'
