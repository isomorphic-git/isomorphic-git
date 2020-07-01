/* eslint-env node, browser, jasmine */
// const { pgp } = require('@isomorphic-git/pgp-plugin')
const { log } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('log', () => {
  it('a file only', async () => {
    const { fs, gitdir } = await makeFixture('test-log-file')
    const commits = await log({
      fs,
      gitdir,
      ref: 'HEAD',
      filepath: 'README.md',
    })
    expect(commits.length).toBe(3)
    expect(commits).toMatchInlineSnapshot(`
      Array [
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593509836,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593509836,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl77B8wACgkQEPFehIUs
      uGi0CQ//ciB5DDcHppFv1caaOiEYUos8oc871eMMbXtl+y9eTfzN6VEwpXY8matE
      3hxMpe4YAUpivfQ3a75d5MEy5iEpF/U9rCkWBlGpdqG3+rvmrvpQXo+PZEzdP84E
      7rz1Ue2PnfivXCzo2zvDoyMLWqFbNgxXIwr0ST2SxuBTsVIwF/6y80uXa/8VQXfK
      MBCFKKcBK03ruZAWiLIwMNvYTxDIMvupRIN2rzyRpOb8lCSWmyw1/eqzF5soVy62
      HraCZlK1iyv9XaL0qn+SlAGYYsJylp8sfLUmU0y2qeEtLYdRLS25yRAK9h7l5RD2
      qTmQwPb5vx1ldFALr90qgVZc3j7xI5xnL6UtiMGSoZM+HuJ3eioOisXf0aAaxr6U
      ImY98WAIPuAAx6rUhHP27r0w0hDABFZmrMtO7FkH6wcqM2LJIweLGFZtKXePmR14
      CH4cQw4ylSjtrcQFguUF7rvz0sX69IeDTTF2ppaH9uQclL+3F0Bj78XiH9Dflx4E
      6+HfY98tdLPcjGfcdAguLBbKZslmYz7uUeqvHyrgVER6xMFcrGR7IUPLI0IWjtqY
      CL+5+gxD2O4FIUhY2hwISLHx+cWsCsAmiBZKx5OhQeW9nn4D8ex4WQK/go7iCrEe
      LnuTba+0qmNBTF7f7a+U0x1ReeipUk19bEuP7P1K7Ppc1C+BYT4=
      =nAWS
      -----END PGP SIGNATURE-----",
            "message": "feat: update to readme and hi.md
      ",
            "parent": Array [
              "8e98db35c3e3e01014f78a60786b1b3b96a49960",
            ],
            "tree": "281d4cba64e37323777e7f3ee222d504ed8fa0ea",
          },
          "oid": "bba48a582aaa7e572c844cf7f42f3cd03eab81f0",
          "payload": "tree 281d4cba64e37323777e7f3ee222d504ed8fa0ea
      parent 8e98db35c3e3e01014f78a60786b1b3b96a49960
      author Riceball LEE <snowyu.lee@gmail.com> 1593509836 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593509836 +0800

      feat: update to readme and hi.md
      ",
        },
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593509669,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593509669,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl77ByUACgkQEPFehIUs
      uGjJYQ/9HNh4TJO/V+ckTyMDzf+Z4Aih6ytn63ispZnfbKb5hPEV+eG1HRuPthF4
      kNilem8w//QYbllbih9bbw3tKvh2SaWYHIOEDI6eA/1k5Bd0nYLi5HNWZG+bOZNR
      XdDI+yPBAQSl4607S2xGeOH7HrSzVSVbheDjNhwYBiRDOvbFxhx3Sc/G+vO8IfdU
      MCLzVhwizNNclKIMWKaUSpBpJuqxsRK4oINT8wJQLB4LRQ/M2CXgjSjZt0e9NtFl
      +6OxGKBbgioNMg6TXzvmqFJ4eqGk1tgMz/qYX1zjCRR2jZ1g/anht8OJRppdz2/0
      k87EN+lLpN5H/Z2tSJMrKBHaCJWo72vrcyQzpLjtVUVdHNdOB66+60yqSDZiz7pc
      1ou/9jM3cbtEwtvaD+W/JJvG7ctFOM7efM3iGghW2jccJ7Ku/DIlxwCXE6HNCjDf
      azPFqO0Y9fw7ZoJl+D7sotea2xaWMhxspUoHxtnYxah6tzJ6KQ8eZ4GR8FoMw2dj
      szUaHVtLRg+Nx/G5YWimOFNUrgA3lQYjh9+fgvodxhIQvd9KVW/qCdX6ZQM9vDXU
      o9d+QEdd/hzkMrOEHscT3nqKgeIEj6JSBg27kDraM6L0dAP4wCN/9h2dbR2ke0j2
      im+CRYtkgJz5EpJ4uN1B7SDUvdBrjYIzC2Aqiohh6M2ehP1in7g=
      =IvVn
      -----END PGP SIGNATURE-----",
            "message": "feat: update to README
      ",
            "parent": Array [
              "533131624898bb8ff588b48c77b26d63e7eb180f",
            ],
            "tree": "2ed69fff23ee6e239744c7277ab80bf40a644ece",
          },
          "oid": "37c51dcbe78dd2fbdca15cf74c6c540f879a5bbb",
          "payload": "tree 2ed69fff23ee6e239744c7277ab80bf40a644ece
      parent 533131624898bb8ff588b48c77b26d63e7eb180f
      author Riceball LEE <snowyu.lee@gmail.com> 1593509669 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593509669 +0800

      feat: update to README
      ",
        },
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593509547,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593509547,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl77BqsACgkQEPFehIUs
      uGj/oRAAmOMhskEjKwcFaEnC7InU/UMd4PHAy3XlKwqUCiQVEJWWi6B81n5IYsWi
      mDOKXGYenlYOAf0HFqs7nPBeINDRFQp03d01wZT7JgacpERCvvu53IHLH8ndJehL
      MQaRtWV/SpScj4OZH4Wzm6tjB4IBB/agZWM67tU4KKI2i6TOhQw8ktBoXbXGWO9g
      OwjHW4mZn5eggIhyNzNKWRwzImopYlcBGqtYil5l4LWXADBfxAYfBCA296HkiD1N
      sFzsi5mak7bKyW5/dFI9uP27BQSLLbGdbJIJlkYXi8XIo/sLPJGA0BHuiNLAVXUn
      E/CO4hBH/tZtJNk3jg0TPLey4Lh34d3Tw8+6z6CvMKQtZ9JUXy8rAWMvAXg0+YVp
      IvT+xA6HxECuBZ6UAYLU1ZHAvQtZch6XhJTirOJ5SMklTNKSiGaCLfDP/iuRWOYo
      4x52uwkInIuintkcIZocjwEQ5DsG6jO4ylbwmEaWgpzEuR7xOuIBx38dsCoSDD+D
      kyZF7ijammlt5Wc6A2u7ewEgCEy/GMEMJ+hUXqhJJ9Gi2uYU/WmC9GJDqD12JsEa
      m6FFvEd+zCH/9K+O5eBUS9WFpiwXPP+amaXGBWkXnlbEYf/j9QemZXi/dkn1qCE7
      yM9yzr8Tb0dJWqvovK42AlCuYsZ9BYOBM3zz+pGhpSdES9OYO08=
      =/hmk
      -----END PGP SIGNATURE-----",
            "message": "first commit
      ",
            "parent": Array [],
            "tree": "5640888e247e986136d36b1d52a9881abc7170f6",
          },
          "oid": "8651dcc28c58d96439e99aa2bf239bf2ab238b73",
          "payload": "tree 5640888e247e986136d36b1d52a9881abc7170f6
      author Riceball LEE <snowyu.lee@gmail.com> 1593509547 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593509547 +0800

      first commit
      ",
        },
      ]
    `)
  })
  it('a deleted file without force should throw error', async () => {
    const { fs, gitdir } = await makeFixture('test-log-file')
    await expect(
      log({
        fs,
        gitdir,
        ref: 'HEAD',
        filepath: 'a/b/rm.md',
      })
    ).rejects.toThrowError('Could not find')
  })
  it('a deleted file forced', async () => {
    const { fs, gitdir } = await makeFixture('test-log-file')
    const commits = await log({
      fs,
      gitdir,
      ref: 'HEAD',
      filepath: 'a/b/rm.md',
      force: true,
    })
    expect(commits.length).toBe(4)
    expect(commits).toMatchInlineSnapshot(`
      Array [
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593509970,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593509970,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl77CFIACgkQEPFehIUs
      uGicBhAAr9NDElwaYSoKk8ayUnlO00E/Kr555Xr+/U0wgfXBoVJoDbVSsIi3IhzZ
      vkWJXVeb1puUyyhYR4o2gdySJ3u3kcpj1xLIeXp+gvNftJyOaCN04m6Hnay2eMXS
      9vZX55PppFXS0B1lB9L95k6ciJEVnoKjEVT1mDunmo1G932qrs6QkU0smKJ7M6fm
      cEonSzi+VCpcACs4toN4PMhrFdPvFEvYK0iG8LXxLkKV+bhmKPeD45TKhJTAfjvV
      86SltUU1ftyJTu2FxsuWeMzxAw57bI/xET4eHVboOnWp3cSPAWX2Mc5H5yWBzRZy
      cPwDIwwvj0WSOtXOWJMW743O+29sNSKZZjoLjrSpwrYWnNYT4ThzdGvKvl2XD9uM
      vzZWgQihdT+My0qXLVuDMAnH56jeUN/fdiBw2oxK+sDMiwssD4Y3GulTQ7o067aU
      dqVCeV0LXTXmLUCvkbSwbKnxRRRxdA/OowH0NDbaYyjMoZ7UqBYiF5M9W1bcB9Op
      RCAfWVB7U7gwgu0PO70g6+LUr1lS+1UnszIvopwsqo301O1qTQBzM4ftuBwQa57P
      SHDxCpZ7bBObayNmW+PLkZSwc/Ak+uGzJdJkVrOA0kq2rlsLxnbysj1XxohIQsnQ
      +RZMMYcW8eev2DeDB+vtr94O8bxQZOH3cfx5gbxvRX5ixG5dn44=
      =8VVM
      -----END PGP SIGNATURE-----",
            "message": "fix: remove rm.md
      ",
            "parent": Array [
              "58aa7508ff84bc25552b4576b1b5ab0ddc5e41dd",
            ],
            "tree": "b0904e4ea2e2548d0ebc5c9401b8a0390c0888cd",
          },
          "oid": "2584400512051e6cb07fda5ff7e8dde556fc3124",
          "payload": "tree b0904e4ea2e2548d0ebc5c9401b8a0390c0888cd
      parent 58aa7508ff84bc25552b4576b1b5ab0ddc5e41dd
      author Riceball LEE <snowyu.lee@gmail.com> 1593509970 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593509970 +0800

      fix: remove rm.md
      ",
        },
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593509879,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593509879,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl77B/cACgkQEPFehIUs
      uGj+hxAAhidyrgiKXUdOh038Wvho48rd0opD2b+1C5kUpjSIrnd+7zKAS34Grveo
      wjdUsk4/Ao/qNLrZHuMwdca9KMt2bywc6X8AToNZXIapXvow3wj/1w9wtxeLyuaR
      7HFFVxBtVHZ9pntMvr5GXUMLqvm8sxXyOQVFxCjXgBCkFku+9Hi9PdTlt5PIvQ5C
      8ORynFVcdl8JPGYe510+lPSZVdgB/lrfDpyFwa1cnpVzXiefQFGSbNDYvh5DUnxv
      5cDmXLS79HFJg+9tnkOeMqKiSPvJU9giPE/Thrq1RYBk+rvEJA8yfl/QdFQBiFp0
      gOetxGoaJestpWNDh5qaCNdgyH3UwP1eR17WUFwR6f9wTaRwUlY8KkDbELjOn5IP
      jD7QopZPCbhSiEcC+5aER6Cfcae1DtQnftG3A/PpNlVRYAdZY/Ls8rxFsac1tdeg
      Q/0a6fpOG9WtsTXyzIvwk+b8ddJshXVslxLWj8Zw5F/PH27p4yRfZT0UscApO3Gf
      xX/nh+4Rs8/BDu8jmUMpJmqR3RVO1WnyShNgB2ONGaDc17bcGNwSz7IKnN5MXOZ6
      HCTNCtysIkl6uKAHq5TydZxz6LVwq+d62AVy1dKnVUqqLySOb7PLiWwZ06Qsvyfq
      iKPeOnlFPUrRBvNdtTfXpRpb4gJ1OJBxsvuxsApr2+vh1be8PCA=
      =Vmf5
      -----END PGP SIGNATURE-----",
            "message": "feat: update to rm.md
      ",
            "parent": Array [
              "bba48a582aaa7e572c844cf7f42f3cd03eab81f0",
            ],
            "tree": "996a1c302a71aeeb3ba865c1a8720bbec39657b9",
          },
          "oid": "58aa7508ff84bc25552b4576b1b5ab0ddc5e41dd",
          "payload": "tree 996a1c302a71aeeb3ba865c1a8720bbec39657b9
      parent bba48a582aaa7e572c844cf7f42f3cd03eab81f0
      author Riceball LEE <snowyu.lee@gmail.com> 1593509879 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593509879 +0800

      feat: update to rm.md
      ",
        },
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593509597,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593509597,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl77Bt0ACgkQEPFehIUs
      uGjwEhAAt+YBPtElFAv+hs5ybANPDKncpDdzYwJ+55aVG/RiWtN51BLj19pGm7Wg
      lxw2NUPPaFkeMvsula7sS8kgDeuEnpapkoBAnPDUUon5KtLR77qn6JGAvdl6EGDN
      x1Vyb3eOTjM0bW34gNTaAS6cHGhjmFFvX+w1Q1i0/kXBzn+/Gzy9IJTxYpoPYm0R
      IIZ+FI34hb7/UV6UjEqT9JqbRq8NQMr4nV5IQeEFBkBW3k9lPkoJvKAk585nGcaG
      NrqFCYI+S1RGChW1JO9dK9iNagvcEp5q1qs3R0Qag5ddf4502gQrHwIrvJBhiRXf
      kg5SBYae+C+UedUEAMI7kEDvzJY2n3s/l2T69HcrCL/0Uzay9hHF7+uQUoXMz+og
      u8kPJSMxEa5Ay2qThFL425d0bv7fm99kv8tVZrgDGAORF7F6cEj+0zAXrG66q7+C
      3zby8ZOtBo5m9lEXhKWfkg3qjHBWSIEzFSf2sIsHZwMwaP/UX4bHc2+gsU4ZuSV9
      ERuEM5rIcbUywNtVDCvRgyABNf+R9u1+OlbEE2gHkso1DiWzVhJl8OgoohNeQ6ve
      usuE81K6Hl0RXFPZEGiP9+VvBKegZr+TpChj/U9Xxg5Xo8h1IJofq+pcM7szyiW+
      XjQ2JObzauS9s+vlQZ3k01acgUxXF+izIb3JLWgZPo8ZQW57evA=
      =8Fqf
      -----END PGP SIGNATURE-----",
            "message": "feat: add content to rm.md
      ",
            "parent": Array [
              "8651dcc28c58d96439e99aa2bf239bf2ab238b73",
            ],
            "tree": "c8a2583e243cfdd458a6ff40ff6f7a2d57fbaa96",
          },
          "oid": "533131624898bb8ff588b48c77b26d63e7eb180f",
          "payload": "tree c8a2583e243cfdd458a6ff40ff6f7a2d57fbaa96
      parent 8651dcc28c58d96439e99aa2bf239bf2ab238b73
      author Riceball LEE <snowyu.lee@gmail.com> 1593509597 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593509597 +0800

      feat: add content to rm.md
      ",
        },
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593509547,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593509547,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl77BqsACgkQEPFehIUs
      uGj/oRAAmOMhskEjKwcFaEnC7InU/UMd4PHAy3XlKwqUCiQVEJWWi6B81n5IYsWi
      mDOKXGYenlYOAf0HFqs7nPBeINDRFQp03d01wZT7JgacpERCvvu53IHLH8ndJehL
      MQaRtWV/SpScj4OZH4Wzm6tjB4IBB/agZWM67tU4KKI2i6TOhQw8ktBoXbXGWO9g
      OwjHW4mZn5eggIhyNzNKWRwzImopYlcBGqtYil5l4LWXADBfxAYfBCA296HkiD1N
      sFzsi5mak7bKyW5/dFI9uP27BQSLLbGdbJIJlkYXi8XIo/sLPJGA0BHuiNLAVXUn
      E/CO4hBH/tZtJNk3jg0TPLey4Lh34d3Tw8+6z6CvMKQtZ9JUXy8rAWMvAXg0+YVp
      IvT+xA6HxECuBZ6UAYLU1ZHAvQtZch6XhJTirOJ5SMklTNKSiGaCLfDP/iuRWOYo
      4x52uwkInIuintkcIZocjwEQ5DsG6jO4ylbwmEaWgpzEuR7xOuIBx38dsCoSDD+D
      kyZF7ijammlt5Wc6A2u7ewEgCEy/GMEMJ+hUXqhJJ9Gi2uYU/WmC9GJDqD12JsEa
      m6FFvEd+zCH/9K+O5eBUS9WFpiwXPP+amaXGBWkXnlbEYf/j9QemZXi/dkn1qCE7
      yM9yzr8Tb0dJWqvovK42AlCuYsZ9BYOBM3zz+pGhpSdES9OYO08=
      =/hmk
      -----END PGP SIGNATURE-----",
            "message": "first commit
      ",
            "parent": Array [],
            "tree": "5640888e247e986136d36b1d52a9881abc7170f6",
          },
          "oid": "8651dcc28c58d96439e99aa2bf239bf2ab238b73",
          "payload": "tree 5640888e247e986136d36b1d52a9881abc7170f6
      author Riceball LEE <snowyu.lee@gmail.com> 1593509547 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593509547 +0800

      first commit
      ",
        },
      ]
    `)
  })
})
