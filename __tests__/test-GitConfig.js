/* eslint-env node, browser, jasmine */
const {GitConfig} = require('isomorphic-git/internal-apis')

describe('GitConfig', () => {
  describe('get value', () => {
    it('simple (foo)', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valfoo
      [bar]
      keyaaa = valbar`)
      let a = await config.get('foo.keyaaa')
      expect(a).toEqual('valfoo')
    })

    it('simple (bar)', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valfoo
      [bar]
      keyaaa = valbar`)
      let a = await config.get('bar.keyaaa')
      expect(a).toEqual('valbar')
    })

    it('implicit boolean value', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valaaa
      keybbb
      keyccc = valccc`)
      let a = await config.get('foo.keybbb')
      expect(a).toEqual('true')
    })

    it('section case insensitive', async () => {
      const config = GitConfig.from(`[Foo]
      keyaaa = valaaa`)
      let a = await config.get('FOO.keyaaa')
      expect(a).toEqual('valaaa')
    })

    it('variable name insensitive', async () => {
      const config = GitConfig.from(`[foo]
      KeyAaa = valaaa`)
      let a = await config.get('foo.KEYaaa')
      expect(a).toEqual('valaaa')
    })

    it('last (when several)', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valaaa
      keybbb = valbbb
      keybbb = valBBB`)
      let a = await config.get('foo.keybbb')
      expect(a).toEqual('valBBB')
    })

    it('multiple', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valaaa
      keybbb = valbbb
      keybbb = valBBB`)
      let a = await config.getall('foo.keybbb')
      expect(a).toEqual(['valbbb', 'valBBB'])
    })

    it('subsection', async () => {
      const config = GitConfig.from(`[remote "foo"]
      url = https://foo.com/project.git
      [remote "bar"]
      url = https://bar.com/project.git`)
      let a = await config.get('remote.bar.url')
      expect(a).toEqual('https://bar.com/project.git')
    })
  })

  describe('get cast value', () => {
    it('using schema', async () => {
      const config = GitConfig.from(`[core]
      repositoryformatversion = 0
      filemode = true
      bare = false
      logallrefupdates = true
      symlinks = false
      ignorecase = true
      bigFileThreshold = 2`)
      let a = await config.get('core.repositoryformatversion')
      let b = await config.get('core.filemode')
      let c = await config.get('core.bare')
      let d = await config.get('core.logallrefupdates')
      let e = await config.get('core.symlinks')
      let f = await config.get('core.ignorecase')
      let g = await config.get('core.bigFileThreshold')
      expect(a).toEqual('0')
      expect(b).toEqual(true)
      expect(c).toEqual(false)
      expect(d).toEqual(true)
      expect(e).toEqual(false)
      expect(f).toEqual(true)
      expect(g).toEqual(2)
    })

    it('special boolean', async () => {
      const config = GitConfig.from(`[core]
      filemode = off
      bare = on
      logallrefupdates = no
      symlinks = true`)
      let a = await config.get('core.filemode')
      let b = await config.get('core.bare')
      let c = await config.get('core.logallrefupdates')
      let d = await config.get('core.symlinks')
      expect(a).toEqual(false)
      expect(b).toEqual(true)
      expect(c).toEqual(false)
      expect(d).toEqual(true)
    })

    it('numeric suffix', async () => {
      const configA = GitConfig.from(`[core]
      bigFileThreshold = 2k`)
      const configB = GitConfig.from(`[core]
      bigFileThreshold = 2m`)
      const configC = GitConfig.from(`[core]
      bigFileThreshold = 2g`)
      let a = await configA.get('core.bigFileThreshold')
      let b = await configB.get('core.bigFileThreshold')
      let c = await configC.get('core.bigFileThreshold')
      expect(a).toEqual(2048)
      expect(b).toEqual(2097152)
      expect(c).toEqual(2147483648)
    })
  })

  describe('insert new value', () => {
    it('existing section', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valaaa`)
      await config.set('foo.keybbb', 'valbbb')
      expect(config.toString()).toEqual(`[foo]
\tkeybbb = valbbb
      keyaaa = valaaa
`)
    })

    it('existing section (case insensitive)', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valaaa`)
      await config.set('FOO.keybbb', 'valbbb')
      expect(config.toString()).toEqual(`[foo]
\tkeybbb = valbbb
      keyaaa = valaaa
`)
    })

    it('existing subsection', async () => {
      const config = GitConfig.from(`[remote "foo"]
      url = https://foo.com/project.git`)
      await config.set('remote.foo.fetch', 'foo')
      expect(config.toString()).toEqual(`[remote "foo"]
\tfetch = foo
      url = https://foo.com/project.git
`)
    })

    it('existing subsection (case insensitive)', async () => {
      const config = GitConfig.from(`[remote "foo"]
      url = https://foo.com/project.git`)
      await config.set('REMOTE.foo.fetch', 'foo')
      expect(config.toString()).toEqual(`[remote "foo"]
\tfetch = foo
      url = https://foo.com/project.git
`)
    })

    it('new section', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valaaa`)
      await config.set('bar.keyaaa', 'valaaa')
      expect(config.toString()).toEqual(`[foo]
      keyaaa = valaaa
[bar]
\tkeyaaa = valaaa
`)
    })

    it('new subsection', async () => {
      const config = GitConfig.from(`[remote "foo"]
      url = https://foo.com/project.git`)
      await config.set('remote.bar.url', 'https://bar.com/project.git')
      expect(config.toString()).toEqual(`[remote "foo"]
      url = https://foo.com/project.git
[remote "bar"]
\turl = https://bar.com/project.git
`)
    })
  })

  describe('replace value', () => {
    it('simple', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valfoo
      [bar]
      keyaaa = valbar
      keybbb = valbbb`)
      await config.set('bar.keyaaa', 'newvalbar')
      expect(config.toString()).toEqual(`[foo]
      keyaaa = valfoo
      [bar]
\tkeyaaa = newvalbar
      keybbb = valbbb
`)
    })

    it('simple (case insensitive)', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valfoo
      [bar]
      keyaaa = valbar
      keybbb = valbbb`)
      await config.set('BAR.keyaaa', 'newvalbar')
      expect(config.toString()).toEqual(`[foo]
      keyaaa = valfoo
      [bar]
\tkeyaaa = newvalbar
      keybbb = valbbb
`)
    })

    it('last (when several)', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valaaa
      keybbb = valbbb
      keybbb = valBBB`)
      await config.set('foo.keybbb', 'newvalBBB')
      expect(config.toString()).toEqual(`[foo]
      keyaaa = valaaa
      keybbb = valbbb
\tkeybbb = newvalBBB
`)
    })

    it('subsection', async () => {
      const config = GitConfig.from(`[remote "foo"]
      url = https://foo.com/project.git
      [remote "bar"]
      url = https://bar.com/project.git`)
      await config.set('remote.foo.url', 'https://foo.com/project-foo.git')
      expect(config.toString()).toEqual(`[remote "foo"]
\turl = https://foo.com/project-foo.git
      [remote "bar"]
      url = https://bar.com/project.git
`)
    })
  })

  describe('append a value to existing key', () => {
    it('simple', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valfoo
      [bar]
      keyaaa = valbar
      keybbb = valbbb`)
      await config.append('bar.keyaaa', 'newvalbar')
      expect(config.toString()).toEqual(`[foo]
      keyaaa = valfoo
      [bar]
      keyaaa = valbar
\tkeyaaa = newvalbar
      keybbb = valbbb
`)
    })

    it('subsection', async () => {
      const config = GitConfig.from(`[remote "foo"]
      url = https://foo.com/project.git
      [remote "bar"]
      url = https://bar.com/project.git`)
      await config.append('remote.baz.url', 'https://baz.com/project.git')
      expect(config.toString()).toEqual(`[remote "foo"]
      url = https://foo.com/project.git
      [remote "bar"]
      url = https://bar.com/project.git
[remote "baz"]
\turl = https://baz.com/project.git
`)
    })
  })

  describe('remove value', () => {
    it('simple', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valaaa
      keybbb = valbbb`)
      await config.set('foo.keyaaa')
      expect(config.toString()).toEqual(`[foo]
      keybbb = valbbb
`)
    })

    it('simple (case insensitive)', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valaaa
      keybbb = valbbb`)
      await config.set('FOO.keyaaa')
      expect(config.toString()).toEqual(`[foo]
      keybbb = valbbb
`)
    })

    it('last (when several)', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valone
      keyaaa = valtwo`)
      await config.set('foo.keyaaa')
      expect(config.toString()).toEqual(`[foo]
      keyaaa = valone
`)
    })

    it('subsection', async () => {
      const config = GitConfig.from(`[remote "foo"]
      url = https://foo.com/project.git
      [remote "bar"]
      url = https://bar.com/project.git`)
      await config.set('remote.foo.url')
      expect(config.toString()).toEqual(`[remote "foo"]
      [remote "bar"]
      url = https://bar.com/project.git
`)
    })
  })

  describe('handle errors', () => {
    it('get unknown key', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valaaa
      keybbb = valbbb`)
      let a = await config.get('foo.unknown')
      expect(a).toBeUndefined()
    })

    it('get unknown section', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valaaa
      keybbb = valbbb`)
      let a = await config.get('bar.keyaaa')
      expect(a).toBeUndefined()
    })

    it('get unknown subsection', async () => {
      const config = GitConfig.from(`[remote "foo"]
      url = https://foo.com/project.git
      [remote "bar"]
      url = https://bar.com/project.git`)
      let a = await config.get('remote.unknown.url')
      expect(a).toBeUndefined()
    })

    it('section is only alphanum _ and . (get)', async () => {
      const config = GitConfig.from(`[fo o]
      keyaaa = valaaa
      [ba~r]
      keyaaa = valaaa
      [ba?z]
      keyaaa = valaaa`)
      let a = await config.get('fo o.keyaaa')
      expect(a).toBeUndefined()
      let b = await config.get('ba~r.keyaaa')
      expect(b).toBeUndefined()
      let c = await config.get('ba?z.keyaaa')
      expect(c).toBeUndefined()
    })

    it('section is only alphanum _ and . (set)', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valfoo`)
      await config.set('ba?r.keyaaa', 'valbar')
      expect(config.toString()).toEqual(`[foo]
      keyaaa = valfoo
`)
    })

    it('variable name is only alphanum _ (get)', async () => {
      const config = GitConfig.from(`[foo]
      key aaa = valaaa
      key?bbb = valbbb
      key%ccc = valccc
      key.ddd = valddd`)
      let a = await config.get('foo.key aaa')
      expect(a).toBeUndefined()
      let b = await config.get('foo.key?bbb')
      expect(b).toBeUndefined()
      let c = await config.get('foo.key%ccc')
      expect(c).toBeUndefined()
      let d = await config.get('foo.key.ddd')
      expect(d).toBeUndefined()
    })

    it('variable name is only alphanum _ (set)', async () => {
      const config = GitConfig.from(`[foo]
      keyaaa = valaaa`)
      await config.set('foo.key bbb', 'valbbb')
      await config.set('foo.key?ccc', 'valccc')
      await config.set('foo.key%ddd', 'valddd')
      expect(config.toString()).toEqual(`[foo]
      keyaaa = valaaa
`)
    })
  })
})
