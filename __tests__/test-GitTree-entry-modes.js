/* eslint-env node, browser, jasmine */
import { GitTree } from 'isomorphic-git/internal-apis'

// When git reads a tree it normalizes each entry's mode with canon_mode(), so
// non-standard modes written by early versions of git or other tools (which
// `git fsck` reports only as a "badFilemode" warning) are read as the
// standard ones.
describe('GitTree entry modes', () => {
  const oid = Buffer.alloc(20, 1)
  // git tree entry on the wire: "<mode> <name>\0<20-byte oid>"
  const entry = (mode, name = 'name') =>
    Buffer.concat([Buffer.from(`${mode} ${name}`), Buffer.from([0]), oid])
  const parse = mode => {
    const [{ mode: parsed, type }] = GitTree.from(entry(mode)).entries()
    return [parsed, type]
  }

  it('reads the standard modes unchanged', () => {
    expect(parse('100644')).toEqual(['100644', 'blob'])
    expect(parse('100755')).toEqual(['100755', 'blob'])
    expect(parse('120000')).toEqual(['120000', 'blob'])
    expect(parse('160000')).toEqual(['160000', 'commit'])
    expect(parse('40000')).toEqual(['040000', 'tree'])
  })

  it('reads regular files as 100755 if the owner can execute them, else 100644', () => {
    expect(parse('100664')).toEqual(['100644', 'blob'])
    expect(parse('100600')).toEqual(['100644', 'blob'])
    expect(parse('100775')).toEqual(['100755', 'blob'])
    expect(parse('100744')).toEqual(['100755', 'blob'])
  })

  it('reads symbolic links, directories and submodules without permissions', () => {
    expect(parse('120664')).toEqual(['120000', 'blob'])
    expect(parse('120777')).toEqual(['120000', 'blob'])
    expect(parse('040755')).toEqual(['040000', 'tree'])
    expect(parse('160644')).toEqual(['160000', 'commit'])
  })

  it('still rejects modes of an unknown type', () => {
    const rejects = mode =>
      expect(() => GitTree.from(entry(mode))).toThrow(
        `Unexpected GitTree entry mode: ${mode}`
      )
    rejects('644')
    rejects('170000')
    rejects('10064a')
  })
})
