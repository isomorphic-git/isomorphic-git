// We're implementing a non-standard clone based on the Github API first, because of CORS.
// And because we already have the code.
import axios from 'axios'
import parseLinkHeader from 'parse-link-header'
import GitObject from '../models/GitObject'
import GitCommit from '../models/GitCommit'
import GitBlob from '../models/GitBlob'
import GitTree from '../models/GitTree'
import write from '../utils/write'
import read from '../utils/read'
import resolveRef from '../utils/resolveRef'
import init from './init'
import fs from 'fs'
import pify from 'pify'
import {Buffer} from 'buffer'

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

async function fetchCommits ({dir, url, user, repo, ref, since, token}) {
  if (!url) {
    url = `https://api.github.com/repos/${user}/${repo}/commits?`
    if (ref) url += `&sha=${ref}`
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
  let link = parseLinkHeader(res.headers['link'])
  
  for (let commit of json) {
    if (!commit.commit.verification.payload) {
      console.log(`Commit ${commit.sha} skipped. Due to a technical limitations and my laziness, only signed commits can be cloned from Github over the API`)
      continue
    }
    let comm = GitCommit.fromPayloadSignature({
      payload: commit.commit.verification.payload,
      signature: commit.commit.verification.signature,
    })
    console.log('Created commit', comm)
    let oid = await GitObject.write({dir, type: 'commit', object: comm.toObject()})
    if (commit.sha !== oid) {
      console.log('AHOY! MATEY! THAR BE TROUBLE WITH \'EM HASHES!')
    }
    console.log(`Stored commit ${commit.sha}`)
  }
  
  if (link && link.next) {
    return fetchCommits({dir, user, repo, ref, since, token, url: link.next.url})
  }
}

async function fetchTree ({dir, url, user, repo, sha, since, token}) {
  let json = await request({token, url: `https://api.github.com/repos/${user}/${repo}/git/trees/${sha}`})
  let tree = new GitTree(json.tree)
  let oid = await GitObject.write({dir, type: 'tree', object: tree.toObject()})
  if (sha !== oid) {
    console.log('AHOY! MATEY! THAR BE TROUBLE WITH \'EM HASHES!')
  }
  console.log(tree.render())
  return Promise.all(json.tree.map(async entry => {
    if (entry.type === 'blob') {
      await fetchBlob({dir, url, user, repo, sha: entry.sha, since, token})
    } else if (entry.type === 'tree') {
      await fetchTree({dir, url, user, repo, sha: entry.sha, since, token})
    }
  }))
}

async function fetchBlob ({dir, url, user, repo, sha, since, token}) {
  let res = await axios.get(`https://api.github.com/repos/${user}/${repo}/git/blobs/${sha}`, {
    headers: {
      'Accept': 'application/vnd.github.raw',
      'Authorization': 'token ' + token,
    },
    responseType: 'arraybuffer'
  })
  let oid = await GitObject.write({dir, type: 'blob', object: res.data})
  if (sha !== oid) {
    console.log('AHOY! MATEY! THAR BE TROUBLE WITH \'EM HASHES!')
  }
}

export default async function fetch ({dir, token, user, repo, ref, remote, since}) {
  let json
  
  if (!ref) {
    console.log('Determining the default branch')
    json = await request({token, url: `https://api.github.com/repos/${user}/${repo}`})
    ref = json.default_branch
  }
  
  console.log('Receiving branches list')
  let getBranches = fetchRemoteBranches({dir, remote, user, repo, token})
  
  console.log('Receiving tags list')
  let getTags = fetchTags({dir, user, repo, token})
  
  console.log('Receiving commits')
  let getCommits = fetchCommits({dir, user, repo, token, ref})
  
  await Promise.all([getBranches, getTags, getCommits])
  
  // This is all crap to get a tree SHA from a commit SHA. Seriously.
  let oid = await resolveRef({dir, ref: `${remote}/${ref}`})
  let {type, object} = await GitObject.read({dir, oid})
  let comm = GitCommit.from(object.toString('utf8'))
  let sha = comm.headers().tree
  console.log('tree: ', sha)
  
  await fetchTree({dir, user, repo, token, sha})
}
