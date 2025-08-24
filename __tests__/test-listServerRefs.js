/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const { listServerRefs } = require('isomorphic-git')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

// NOTE:
// Protocol Version 1 is incapable of reporting all the symrefs in a repo
// It reports HEAD but does not report refs/heads/symbol.
// So that discrepancy between the results for version 1 and version 2 is correct.
describe('listServerRefs', () => {
  it('protocol 1', async () => {
    const refs = await listServerRefs({
      http,
      url: `http://${localhost}:8888/test-listServerRefs.git`,
      protocolVersion: 1,
    })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "HEAD",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/master",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/symbol",
        },
        Object {
          "oid": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
          "ref": "refs/heads/test",
        },
        Object {
          "oid": "48424d105c9eac701cd734a0032fcc71505797e6",
          "ref": "refs/tags/test",
        },
      ]
    `)
  })

  it('protocol 1, symrefs', async () => {
    const refs = await listServerRefs({
      http,
      url: `http://${localhost}:8888/test-listServerRefs.git`,
      protocolVersion: 1,
      symrefs: true,
    })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "HEAD",
          "target": "refs/heads/master",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/master",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/symbol",
        },
        Object {
          "oid": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
          "ref": "refs/heads/test",
        },
        Object {
          "oid": "48424d105c9eac701cd734a0032fcc71505797e6",
          "ref": "refs/tags/test",
        },
      ]
    `)
  })

  it('protocol 1, peelTags', async () => {
    const refs = await listServerRefs({
      http,
      url: `http://${localhost}:8888/test-listServerRefs.git`,
      protocolVersion: 1,
      peelTags: true,
    })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "HEAD",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/master",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/symbol",
        },
        Object {
          "oid": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
          "ref": "refs/heads/test",
        },
        Object {
          "oid": "48424d105c9eac701cd734a0032fcc71505797e6",
          "peeled": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/tags/test",
        },
      ]
    `)
  })

  it('protocol 1, prefix', async () => {
    const refs = await listServerRefs({
      http,
      url: `http://${localhost}:8888/test-listServerRefs.git`,
      protocolVersion: 1,
      prefix: 'refs/heads',
    })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/master",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/symbol",
        },
        Object {
          "oid": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
          "ref": "refs/heads/test",
        },
      ]
    `)
  })

  it('protocol 1, kitchen sink', async () => {
    const refs = await listServerRefs({
      http,
      url: `http://${localhost}:8888/test-listServerRefs.git`,
      protocolVersion: 1,
      prefix: 'refs/',
      symrefs: true,
      peelTags: true,
    })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/master",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/symbol",
        },
        Object {
          "oid": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
          "ref": "refs/heads/test",
        },
        Object {
          "oid": "48424d105c9eac701cd734a0032fcc71505797e6",
          "peeled": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/tags/test",
        },
      ]
    `)
  })

  it('protocol 2', async () => {
    const refs = await listServerRefs({
      http,
      url: `http://${localhost}:8888/test-listServerRefs.git`,
      protocolVersion: 2,
    })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "HEAD",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/master",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/symbol",
        },
        Object {
          "oid": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
          "ref": "refs/heads/test",
        },
        Object {
          "oid": "48424d105c9eac701cd734a0032fcc71505797e6",
          "ref": "refs/tags/test",
        },
      ]
    `)
  })

  it('protocol 2, symrefs', async () => {
    const refs = await listServerRefs({
      http,
      url: `http://${localhost}:8888/test-listServerRefs.git`,
      protocolVersion: 2,
      symrefs: true,
    })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "HEAD",
          "target": "refs/heads/master",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/master",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/symbol",
          "target": "refs/heads/master",
        },
        Object {
          "oid": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
          "ref": "refs/heads/test",
        },
        Object {
          "oid": "48424d105c9eac701cd734a0032fcc71505797e6",
          "ref": "refs/tags/test",
        },
      ]
    `)
  })

  it('protocol 2, peelTags', async () => {
    const refs = await listServerRefs({
      http,
      url: `http://${localhost}:8888/test-listServerRefs.git`,
      protocolVersion: 2,
      peelTags: true,
    })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "HEAD",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/master",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/symbol",
        },
        Object {
          "oid": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
          "ref": "refs/heads/test",
        },
        Object {
          "oid": "48424d105c9eac701cd734a0032fcc71505797e6",
          "peeled": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/tags/test",
        },
      ]
    `)
  })

  it('protocol 2, prefix', async () => {
    const refs = await listServerRefs({
      http,
      url: `http://${localhost}:8888/test-listServerRefs.git`,
      protocolVersion: 2,
      prefix: 'refs/heads',
    })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/master",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/symbol",
        },
        Object {
          "oid": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
          "ref": "refs/heads/test",
        },
      ]
    `)
  })

  it('protocol 2, kitchen sink', async () => {
    const refs = await listServerRefs({
      http,
      url: `http://${localhost}:8888/test-listServerRefs.git`,
      protocolVersion: 2,
      prefix: 'refs/',
      symrefs: true,
      peelTags: true,
    })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/master",
        },
        Object {
          "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/heads/symbol",
          "target": "refs/heads/master",
        },
        Object {
          "oid": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
          "ref": "refs/heads/test",
        },
        Object {
          "oid": "48424d105c9eac701cd734a0032fcc71505797e6",
          "peeled": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "ref": "refs/tags/test",
        },
      ]
    `)
  })
})
