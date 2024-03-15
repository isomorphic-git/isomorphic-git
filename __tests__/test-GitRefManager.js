/* eslint-env node, browser, jasmine */
const { GitRefManager } = require('isomorphic-git/internal-apis')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('GitRefManager', () => {
  it('packedRefs', async () => {
    const { fs, gitdir } = await makeFixture('test-GitRefManager')
    const refs = await GitRefManager.packedRefs({ fs, gitdir })
    expect(refs).toMatchInlineSnapshot(`
      Map {
        "refs/remotes/origin/develop" => "dba5b92408549e55c36e16c89e2b4a4e4cbc8c8f",
        "refs/remotes/origin/dist" => "a2dd810e222b7b02fc53760037d9928cb97c645d",
        "refs/remotes/origin/gh-pages" => "1bfb4d0bce3fda5b26f189311dfef0a94390be38",
        "refs/remotes/origin/git-fetch" => "5741bed81a5e38744ec8ca88b5aa4f058467d4bf",
        "refs/remotes/origin/greenkeeper/semantic-release-11.0.2" => "665910e9294fe796499917c472b4ead573a11b06",
        "refs/remotes/origin/master" => "dba5b92408549e55c36e16c89e2b4a4e4cbc8c8f",
        "refs/remotes/origin/test-branch" => "e10ebb90d03eaacca84de1af0a59b444232da99e",
        "refs/remotes/origin/test-branch-shallow-clone" => "92e7b4123fbf135f5ffa9b6fe2ec78d07bbc353e",
        "refs/tags/test-tag" => "1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9",
        "refs/tags/v0.0.1" => "1a2149e96a9767b281a8f10fd014835322da2d14",
        "refs/tags/v0.0.10" => "0a117b8378f5e5323d15694c7eb8f62c4bea152b",
        "refs/tags/v0.0.10^{}" => "ce03143bd6567fc7063549c204e877834cda5645",
        "refs/tags/v0.0.11" => "acd8de39da34f0f05b07f0494675afa914fadbd9",
        "refs/tags/v0.0.11^{}" => "8388a3d4197bf9e02bb97dfdc920fe6b6353453d",
        "refs/tags/v0.0.12" => "9dba4bc0f13b98a21a9f8c41b9dcc174df6e8dd9",
        "refs/tags/v0.0.12^{}" => "8d74454009b9bf7bf1df39ad31c8191bd9ac591b",
        "refs/tags/v0.0.13" => "0d7c8bcac6c824e8a857eeceeab4416427314202",
        "refs/tags/v0.0.13^{}" => "af70a57e828aa1f7de829b1987915abe3aeeab85",
        "refs/tags/v0.0.14" => "1560793d9e6c08dddb9218ec7a58a96f55664f7f",
        "refs/tags/v0.0.14^{}" => "71cfcca36f2403662acf3390ae7654a0cb52fbfc",
        "refs/tags/v0.0.15" => "78bae74bb8d82877c703cca5da8a6ffd50facd17",
        "refs/tags/v0.0.15^{}" => "f531be257f90a5211ed5f63a417b1a3bc27ab2bb",
        "refs/tags/v0.0.16" => "8c2189d3745bb88f2e34d2dbb97028a9dead1a29",
        "refs/tags/v0.0.16^{}" => "252cb320650c604db9e504e0b04dea0e94922802",
        "refs/tags/v0.0.17" => "6f09d58133a791fc3a2493471d4b3d49f9e935d6",
        "refs/tags/v0.0.17^{}" => "5354394fb099b5713c60fe6be2350457d6d2d658",
        "refs/tags/v0.0.18" => "1739d0abdf493ad61caf11a10417dbf0f87bd2c9",
        "refs/tags/v0.0.18^{}" => "2359fff39771f72c94b8b034803c7722319a1405",
        "refs/tags/v0.0.19" => "180c9e01421744a307fb309f79b828ef71b47f4c",
        "refs/tags/v0.0.19^{}" => "9e4130538be3129100aecf9218a6be0fc35f9911",
        "refs/tags/v0.0.2" => "9e3ee22249ed50acccfd3996dadb5d27019a7dad",
        "refs/tags/v0.0.20" => "993509d291a58bc8c8dd8d23829d5294e057de22",
        "refs/tags/v0.0.20^{}" => "12cef164723a8ebcbbc2b9a48212a83bfcd9eecf",
        "refs/tags/v0.0.21" => "5b71480a0e679bf29cad790a78fd4df551a96097",
        "refs/tags/v0.0.21^{}" => "b25b4120b1ee4fc2ec4c2016268e1e42602b6a86",
        "refs/tags/v0.0.22" => "259ccc39944411d632189e4d7e009cd5d2485636",
        "refs/tags/v0.0.22^{}" => "eb95df88672e6f258ef6b759ab341f8b99dc477a",
        "refs/tags/v0.0.23" => "c0bc224f093f93d99c6e68b6b5ceedfeecf61bb9",
        "refs/tags/v0.0.23^{}" => "c81055a43f1691af59707076d78405b6d3235fea",
        "refs/tags/v0.0.24" => "463103b31c473c25e87288f564a8e73a9476777b",
        "refs/tags/v0.0.24^{}" => "d33eab687ba73b586239843dd8c3bc4267f1b358",
        "refs/tags/v0.0.25" => "79d7db0650cffe24e307dd4ba881ccbdf0011e6a",
        "refs/tags/v0.0.25^{}" => "b2c43af335e94255839aae1f2b1a97995040f389",
        "refs/tags/v0.0.26" => "e611dd73aeeef5add4bda82a00f7e9af7d17d9dd",
        "refs/tags/v0.0.26^{}" => "fae8a72f545106b2816641f5452bf7f7e99ea2a8",
        "refs/tags/v0.0.27" => "a233f65a609c07bc6e31bfc0bc051d98c8cfe18e",
        "refs/tags/v0.0.28" => "6398b5cb041d23de187f46c8888768d96b3cd01e",
        "refs/tags/v0.0.29" => "24ca84f16a4bcbf8b252eb0c4250a6c818cf00d3",
        "refs/tags/v0.0.3" => "3e6345233bb696737784f423ace943e0eaa2b30c",
        "refs/tags/v0.0.3^{}" => "b3ed1e3f15c9bcab23833dbb5ef6a8e2198ec4e2",
        "refs/tags/v0.0.30" => "c8ea7416948bdc19c1ca1b51b8897ed9201597dd",
        "refs/tags/v0.0.31" => "f754b0f027c72695cbfd37c990559bc61bf583b6",
        "refs/tags/v0.0.32" => "c2dcbda8dbe0fb614de6340b273e7bba9ab52a37",
        "refs/tags/v0.0.33" => "8411968f6359c8ae7e85b5da7e417002477263ea",
        "refs/tags/v0.0.34" => "dc887a60db904f58b558857ba7a6c39dd1d18f22",
        "refs/tags/v0.0.35" => "dd242320e5b0054c9468e4ab5cc3c4722051dd43",
        "refs/tags/v0.0.36" => "bc31c33f9b9dbaf6a2c15c118f9f8924600c6331",
        "refs/tags/v0.0.37" => "e723960dde1fa6dd1379642c80d09d2a1e5e2d16",
        "refs/tags/v0.0.38" => "e97c6ed41ae435991f2c4c1faaa0e72ad7b35c67",
        "refs/tags/v0.0.4" => "01509d00409c556c331bb278269c6ca770eb7c52",
        "refs/tags/v0.0.4^{}" => "3eb8f48d22cac58d8ba42237cb2227ef90bfce08",
        "refs/tags/v0.0.5" => "ff03e74259efab829557d0b3c15d6c76b9458262",
        "refs/tags/v0.0.6" => "20668e724eed5fffd23968793aee0592babac2ab",
        "refs/tags/v0.0.6^{}" => "641859e5e6bad88afab83a4a3e94903ed1d8e10b",
        "refs/tags/v0.0.7" => "6dedfbd21a0633055a93c05cc8b4b5cd89f2b708",
        "refs/tags/v0.0.8" => "4606f7652aba2b7e8d7c70eb0aa6cd75226f4d83",
        "refs/tags/v0.0.8^{}" => "025860fcfb6af84739a924ff49bcbda036855b1a",
        "refs/tags/v0.0.9" => "6e90dfd7573404a225888071ecaa572882b4e45c",
        "refs/tags/v0.0.9^{}" => "af4d84a6a9fa7a74acdad07fddf9f17ff3a974ae",
        "refs/tags/v0.1.0" => "dba5b92408549e55c36e16c89e2b4a4e4cbc8c8f",
      }
    `)
  })
  it('listRefs', async () => {
    const { fs, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: 'refs/remotes/origin',
    })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        "develop",
        "dist",
        "gh-pages",
        "git-fetch",
        "greenkeeper/semantic-release-11.0.2",
        "master",
        "test-branch",
        "test-branch-shallow-clone",
      ]
    `)
    refs = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: 'refs/tags',
    })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        "local-tag",
        "test-tag",
        "v0.0.1",
        "v0.0.10",
        "v0.0.10^{}",
        "v0.0.11",
        "v0.0.11^{}",
        "v0.0.12",
        "v0.0.12^{}",
        "v0.0.13",
        "v0.0.13^{}",
        "v0.0.14",
        "v0.0.14^{}",
        "v0.0.15",
        "v0.0.15^{}",
        "v0.0.16",
        "v0.0.16^{}",
        "v0.0.17",
        "v0.0.17^{}",
        "v0.0.18",
        "v0.0.18^{}",
        "v0.0.19",
        "v0.0.19^{}",
        "v0.0.2",
        "v0.0.20",
        "v0.0.20^{}",
        "v0.0.21",
        "v0.0.21^{}",
        "v0.0.22",
        "v0.0.22^{}",
        "v0.0.23",
        "v0.0.23^{}",
        "v0.0.24",
        "v0.0.24^{}",
        "v0.0.25",
        "v0.0.25^{}",
        "v0.0.26",
        "v0.0.26^{}",
        "v0.0.27",
        "v0.0.28",
        "v0.0.29",
        "v0.0.3",
        "v0.0.3^{}",
        "v0.0.30",
        "v0.0.31",
        "v0.0.32",
        "v0.0.33",
        "v0.0.34",
        "v0.0.35",
        "v0.0.36",
        "v0.0.37",
        "v0.0.38",
        "v0.0.4",
        "v0.0.4^{}",
        "v0.0.5",
        "v0.0.6",
        "v0.0.6^{}",
        "v0.0.7",
        "v0.0.8",
        "v0.0.8^{}",
        "v0.0.9",
        "v0.0.9^{}",
        "v0.1.0",
      ]
    `)
  })
  it('listBranches', async () => {
    const { fs, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listBranches({ fs, gitdir })
    expect(refs).toEqual([])
    refs = await GitRefManager.listBranches({
      fs,
      gitdir,
      remote: 'origin',
    })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        "develop",
        "dist",
        "gh-pages",
        "git-fetch",
        "greenkeeper/semantic-release-11.0.2",
        "master",
        "test-branch",
        "test-branch-shallow-clone",
      ]
    `)
  })
  it('listTags', async () => {
    const { fs, gitdir } = await makeFixture('test-GitRefManager')
    const refs = await GitRefManager.listTags({ fs, gitdir })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        "local-tag",
        "test-tag",
        "v0.0.1",
        "v0.0.10",
        "v0.0.11",
        "v0.0.12",
        "v0.0.13",
        "v0.0.14",
        "v0.0.15",
        "v0.0.16",
        "v0.0.17",
        "v0.0.18",
        "v0.0.19",
        "v0.0.2",
        "v0.0.20",
        "v0.0.21",
        "v0.0.22",
        "v0.0.23",
        "v0.0.24",
        "v0.0.25",
        "v0.0.26",
        "v0.0.27",
        "v0.0.28",
        "v0.0.29",
        "v0.0.3",
        "v0.0.30",
        "v0.0.31",
        "v0.0.32",
        "v0.0.33",
        "v0.0.34",
        "v0.0.35",
        "v0.0.36",
        "v0.0.37",
        "v0.0.38",
        "v0.0.4",
        "v0.0.5",
        "v0.0.6",
        "v0.0.7",
        "v0.0.8",
        "v0.0.9",
        "v0.1.0",
      ]
    `)
  })
  it('concurrently reading/writing a ref should not cause a NotFoundError resolving it', async () => {
    // There are some expect() calls below, but as of 2023-03-15, if this test fails it will do so by logging instances
    // of 'NotFoundError: Could not find myRef', which should not happen.
    const { fs, gitdir } = await makeFixture('test-GitRefManager')
    const ref = 'myRef'
    const value = '1234567890123456789012345678901234567890'
    await GitRefManager.writeRef({ fs, gitdir, ref, value }) // Guarantee that the file for the ref exists on disk

    const writePromises = []
    const resolvePromises = []
    // Some arbitrary number of iterations that seems to guarantee that the error (pre-fix) is hit.
    // With 100 the test *mostly* failed but still passed every now and then.
    const iterations = 500

    for (let i = 0; i < iterations; i++) {
      // I was only able to cause the error to reproduce consistently by mixing awaited and non-awaited versions of the
      // calls to writeRef() and resolve(). I tried several variations of the combination but none of them caused the
      // error to happen as consistently.
      if (Math.random() < 0.5) {
        await GitRefManager.writeRef({ fs, gitdir, ref, value })
      } else {
        writePromises.push(GitRefManager.writeRef({ fs, gitdir, ref, value }))
      }
      if (Math.random() < 0.5) {
        const resolvedRef = await GitRefManager.resolve({ fs, gitdir, ref })
        expect(resolvedRef).toMatch(value)
      } else {
        resolvePromises.push(GitRefManager.resolve({ fs, gitdir, ref }))
      }
    }

    const resolvedRefs = await Promise.all(resolvePromises)
    for (const resolvedRef of resolvedRefs) {
      expect(resolvedRef).toMatch(value)
    }
    await Promise.all(writePromises)
  })
})
