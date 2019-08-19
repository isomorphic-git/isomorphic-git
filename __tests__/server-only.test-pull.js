/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// const nockBack = require('nock').back
const nock = require('nock')
const path = require('path')

const { pull, resolveRef } = require('isomorphic-git')

describe('pull', () => {
  beforeAll(() => {
    nock.back.fixtures = path.join(__dirname, '__nockbacks__')
  })
  it('basic pull', async () => {
    // Setup
    const { nockDone } = await nock.back('pull - basic pull.json')
    const { dir, gitdir } = await makeFixture('test-pull-client')
    // Test
    const desiredOid = '97c024f73eaab2781bf3691597bc7c833cb0e22f'
    await pull({
      dir,
      gitdir,
      ref: 'master',
      fastForwardOnly: true
    })
    const oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
    // Teardown
    nockDone()
  })
})
