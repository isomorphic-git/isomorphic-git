import shasum from 'shasum'
import wrapCommit from './wrapCommit'

export default function commitSha (commit) {
  return shasum(wrapCommit(commit))
}
