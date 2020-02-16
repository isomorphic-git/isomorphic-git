/* eslint-env node, browser, jasmine */
const { findMergeBase } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// These have been checked with
// GIT_DIR=__tests__/__fixtures__/test-findMergeBase.git git merge-base -a --octopus COMMITS
describe('findMergeBase', () => {
  it('silly edge cases', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-findMergeBase')
    let base
    // Test
    base = await findMergeBase({
      fs,
      gitdir,
      oids: ['9ec6646dd454e8f530c478c26f8b06e57f880bd6'],
    })
    expect(base).toEqual(['9ec6646dd454e8f530c478c26f8b06e57f880bd6'])

    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '9ec6646dd454e8f530c478c26f8b06e57f880bd6',
        '9ec6646dd454e8f530c478c26f8b06e57f880bd6',
      ],
    })
    expect(base).toEqual(['9ec6646dd454e8f530c478c26f8b06e57f880bd6'])
  })
  it('no common ancestor scenarios', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-findMergeBase')
    // Test
    const base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '9ec6646dd454e8f530c478c26f8b06e57f880bd6', // A
        '99cfd5bb4e412234162ac1eb46350ec6ccffb50d', // Z
      ],
    })
    expect(base).toEqual([])
  })
  it('fast-forward scenarios', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-findMergeBase')
    let base
    // Test
    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '9ec6646dd454e8f530c478c26f8b06e57f880bd6', // A
        'f79577b91d302d87e310c8b5af8c274bbf45502f', // C
      ],
    })
    expect(base).toEqual(['f79577b91d302d87e310c8b5af8c274bbf45502f'])

    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '21605c3fda133ae46f000a375c92c889fa0688ba', // F
        '9ec6646dd454e8f530c478c26f8b06e57f880bd6', // A
      ],
    })
    expect(base).toEqual(['21605c3fda133ae46f000a375c92c889fa0688ba'])

    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '21605c3fda133ae46f000a375c92c889fa0688ba', // F
        '8d01f1824e6818db3461c06f09a0965810396a45', // G
      ],
    })
    expect(base).toEqual(['21605c3fda133ae46f000a375c92c889fa0688ba'])

    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '21605c3fda133ae46f000a375c92c889fa0688ba', // F
        '9ec6646dd454e8f530c478c26f8b06e57f880bd6', // A
        'f79577b91d302d87e310c8b5af8c274bbf45502f', // C
      ],
    })
    expect(base).toEqual(['f79577b91d302d87e310c8b5af8c274bbf45502f'])
  })
  it('diverging scenarios', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-findMergeBase')
    let base
    // Test
    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        'c91a8aab1f086c8cc8914558f035e718a8a5c503', // B
        'f79577b91d302d87e310c8b5af8c274bbf45502f', // C
      ],
    })
    expect(base).toEqual(['0526923cafece3d898dbe55ee2c2d69bfcc54c60'])

    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '8d01f1824e6818db3461c06f09a0965810396a45', // G
        '9ec6646dd454e8f530c478c26f8b06e57f880bd6', // A
      ],
    })
    expect(base).toEqual(['21605c3fda133ae46f000a375c92c889fa0688ba'])

    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '8a7e4628451951581c6ce84850bd474e107ee750', // D
        '9ec6646dd454e8f530c478c26f8b06e57f880bd6', // A
      ],
    })
    expect(base).toEqual(['592ad92519d993cc44c77663d85bb7e0f961a840'])

    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '8a7e4628451951581c6ce84850bd474e107ee750', // D
        '8d0e46852781eed81d32b91517f5d5f0979575c4', // E
      ],
    })
    expect(base).toEqual(['592ad92519d993cc44c77663d85bb7e0f961a840'])

    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '8a7e4628451951581c6ce84850bd474e107ee750', // D
        '8d0e46852781eed81d32b91517f5d5f0979575c4', // E
        '9ec6646dd454e8f530c478c26f8b06e57f880bd6', // A
      ],
    })
    expect(base).toEqual(['592ad92519d993cc44c77663d85bb7e0f961a840'])

    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '8a7e4628451951581c6ce84850bd474e107ee750', // D
        '8d0e46852781eed81d32b91517f5d5f0979575c4', // E
        '9ec6646dd454e8f530c478c26f8b06e57f880bd6', // A
        'c91a8aab1f086c8cc8914558f035e718a8a5c503', // B
      ],
    })
    expect(base).toEqual(['0526923cafece3d898dbe55ee2c2d69bfcc54c60'])
  })
  it('merge commit scenarios', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-findMergeBase')
    let base
    // Test
    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '423489657e9529ecf285637eb21f40c8657ece3f', // M
        '9ec6646dd454e8f530c478c26f8b06e57f880bd6', // A
      ],
    })
    expect(base).toEqual(['21605c3fda133ae46f000a375c92c889fa0688ba'])

    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '423489657e9529ecf285637eb21f40c8657ece3f', // M
        '423489657e9529ecf285637eb21f40c8657ece3f', // M
      ],
    })
    expect(base).toEqual(['423489657e9529ecf285637eb21f40c8657ece3f'])

    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '423489657e9529ecf285637eb21f40c8657ece3f', // M
        '8a7e4628451951581c6ce84850bd474e107ee750', // D
      ],
    })
    expect(base).toEqual(['592ad92519d993cc44c77663d85bb7e0f961a840'])

    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '423489657e9529ecf285637eb21f40c8657ece3f', // M
        '8d01f1824e6818db3461c06f09a0965810396a45', // G
      ],
    })
    expect(base).toEqual(['21605c3fda133ae46f000a375c92c889fa0688ba'])

    base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '423489657e9529ecf285637eb21f40c8657ece3f', // M
        '8d01f1824e6818db3461c06f09a0965810396a45', // G
        '9ec6646dd454e8f530c478c26f8b06e57f880bd6', // A
      ],
    })
    expect(base).toEqual(['21605c3fda133ae46f000a375c92c889fa0688ba'])
  })
  it('recursive merge base scenarios', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-findMergeBase')
    // Test
    const base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '85303393b9fd415d48913dfec47d42db184dc4d8', // Z1
        '4c658ff41121ddada50c47e4c72c092a9f7bf2be', // Z2
      ],
    })
    expect(base).toEqual([
      '17aa7af08369d0e2d174df64d78fe57f9f0a60ba',
      '17b2c7d8ba9756c6c28e4d8cfdbed11793952270',
    ])
  })

  it('fork & rejoin in one branch base scenarios', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-findMergeBase')
    // Test
    const base = await findMergeBase({
      fs,
      gitdir,
      oids: [
        '815474b6e581921cbe05825631decac922803d28', // issue819-upstream
        '83ad8e1ec6f21f8d0d74587b6a8021fec1a165e1', // isse819
      ],
    })
    expect(base).toEqual(['2316ae441d2c72d8d15673beb81390272671c526'])
  })
})
