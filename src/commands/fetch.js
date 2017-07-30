// We're implementing a non-standard clone based on the Github API first, because of CORS.
// And because we already have the code.
import write from 'write'
import axios from 'axios'
import pako from 'pako'
import parseLinkHeader from 'parse-link-header'
import combinePayloadAndSignature from '../utils/combinePayloadAndSignature'
import commitSha from '../utils/commitSha'
import wrapCommit from '../utils/wrapCommit'
import init from './init'

async function request ({url, token, headers}) {
  let res = await axios.get(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + token,
      ...headers
    }
  })
  return res.data
}

async function fetchRemoteBranches ({dir, remote, user, repo, token}) {
  return request({token, url: `https://api.github.com/repos/${user}/${repo}/branches`})
  .then(json =>
    Promise.all(json.map(branch =>
      write(`${dir}/.git/refs/remotes/${remote}/${branch.name}`, branch.commit.sha + '\n', {encoding: 'utf8'})
    ))
  )
}

async function fetchTags ({dir, user, repo, token}) {
  return request({token, url: `https://api.github.com/repos/${user}/${repo}/tags`})
  .then(json =>
    Promise.all(json.map(tag =>
      // Curiously, tags are not separated between remotes like branches
      write(`${dir}/.git/refs/tags/${tag.name}`, tag.commit.sha + '\n', {encoding: 'utf8'})
    ))
  )
}

async function fetchCommits ({dir, url, user, repo, commitish, since, token}) {
  if (!url) {
    url = `https://api.github.com/repos/${user}/${repo}/commits?`
    if (commitish) url += `&sha=${commitish}`
    if (since) {
      let date = (new Date(since * 1000)).toISOString()
      url += `&since=${date}`
    }
  }
  let res = await axios.get(url, {
    headers: {
      'Accept': 'application/vnd.github.cryptographer-preview',
      'Authorization': 'token ' + token,
    }
  })
  let json = res.data
  console.log('json =', json)
  console.log('res.headers[\'Link\'] =', res.headers['link'])
  let pagination = parseLinkHeader(res.headers['link'])
  
  
  for (let commit of json) {
    if (!commit.commit.verification.payload) {
      console.log(`Commit ${commit.sha} skipped. Due to a technical limitations and my laziness, only signed commits can be cloned from Github over the API`)
      continue
    }
    try {
      let comm = combinePayloadAndSignature({
        payload: commit.commit.verification.payload,
        signature: commit.commit.verification.signature,
      })
      if (commit.sha !== commitSha(comm)) {
        throw new Error('Commit hash does not match the computed SHA1 sum.')
      }
      console.log('GitCommit.fromPayloadSignature(commit) =', comm)
      let dcomm = pako.deflate(wrapCommit(comm))
      await write(`${dir}/.git/objects/${commit.sha.slice(0, 2)}/${commit.sha.slice(2)}`, dcomm)
      console.log(`Added commit ${commit.sha}`)
    } catch (e) {
      console.log(e.message, commit.sha)
    }
  }
  if (pagination.next) {
    return fetchCommits({dir, user, repo, commitish, since, token, url: pagination.next.url})
  }
}

export default async function fetch ({dir, token, user, repo, branch, remote, since}) {
  let json
  
  let checkoutCommitish
  if (branch) {
    checkoutCommitish = branch
  } else {
    console.log('Determining the default branch')
    json = await request({token, url: `https://api.github.com/repos/${user}/${repo}`})
    checkoutCommitish = json.default_branch
  }
  
  console.log('Receiving branches list')
  let getBranches = fetchRemoteBranches({dir, remote, user, repo, token})
  
  console.log('Receiving tags list')
  let getTags = fetchTags({dir, user, repo, token})
  
  console.log('Receiving commits')
  let getCommits = fetchCommits({dir, user, repo, token, commitish: checkoutCommitish})
  
  await Promise.all([getBranches, getTags, getCommits])
}

if (!module.parent) {
  let token = process.env.GITHUB_TOKEN
  let origin = 'wmhilton/nde'
  clone({token, origin}).then(() => console.log('done'))
}
