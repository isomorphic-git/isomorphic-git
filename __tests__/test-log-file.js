/* eslint-env node, browser, jasmine */
// const { pgp } = require('@isomorphic-git/pgp-plugin')
const { log } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('log', () => {
  it('a newly added file', async () => {
    const { fs, gitdir } = await makeFixture('test-log-file')
    const commits = await log({
      fs,
      gitdir,
      ref: 'HEAD',
      filepath: 'newfile.md',
    })
    expect(commits.length).toBe(2)
    expect(commits).toMatchInlineSnapshot(`
      Array [
        Object {
          "commit": Object {
            "author": Object {
              "email": "araknast@protonmail.com",
              "name": "araknast",
              "timestamp": 1653969605,
              "timezoneOffset": 420,
            },
            "committer": Object {
              "email": "araknast@protonmail.com",
              "name": "araknast",
              "timestamp": 1653969605,
              "timezoneOffset": 420,
            },
            "message": "update newfile
      ",
            "parent": Array [
              "dcb1c5fe6cc28e7757c4bc4d7dbf5b061c38ec48",
            ],
            "tree": "331f342f6e9b38c45e17189691134cb4a72189d2",
          },
          "oid": "04833cdb10e0f8fa81800cafa98e1381a1c6c58e",
          "payload": "tree 331f342f6e9b38c45e17189691134cb4a72189d2
      parent dcb1c5fe6cc28e7757c4bc4d7dbf5b061c38ec48
      author araknast <araknast@protonmail.com> 1653969605 -0700
      committer araknast <araknast@protonmail.com> 1653969605 -0700
      
      update newfile
      ",
        },
        Object {
          "commit": Object {
            "author": Object {
              "email": "araknast@protonmail.com",
              "name": "araknast",
              "timestamp": 1653969041,
              "timezoneOffset": 420,
            },
            "committer": Object {
              "email": "araknast@protonmail.com",
              "name": "araknast",
              "timestamp": 1653969041,
              "timezoneOffset": 420,
            },
            "message": "add newfile
      ",
            "parent": Array [
              "18f202dfed5cb66a295dc57f1f4ba1b7f6b74f36",
            ],
            "tree": "59c1caba006bb27077d11f1c0ff7ad3ff4b2b422",
          },
          "oid": "dcb1c5fe6cc28e7757c4bc4d7dbf5b061c38ec48",
          "payload": "tree 59c1caba006bb27077d11f1c0ff7ad3ff4b2b422
      parent 18f202dfed5cb66a295dc57f1f4ba1b7f6b74f36
      author araknast <araknast@protonmail.com> 1653969041 -0700
      committer araknast <araknast@protonmail.com> 1653969041 -0700
      
      add newfile
      ",
        },
      ]
    `)
  })
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
    let err
    try {
      await log({
        fs,
        gitdir,
        ref: 'HEAD',
        filepath: 'a/b/rm.md',
      })
    } catch (error) {
      err = error
    }
    expect(err).toBeDefined()
    expect(err.message).toMatch('Could not find')
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
    expect(commits.length).toBe(6)
    expect(commits).toMatchInlineSnapshot(`
      Array [
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593652995,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593652995,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl79NwMACgkQEPFehIUs
      uGh+EA//f+cNby3i8IhD5LL5elmR6qp+KFNLQMEa7nvcUmYQX2Ffx4QAN0WtPQ+O
      y6PmrQg5MLfCPzANthY3oKnkvjIYbpnBF2JTeN2HA8mF8/HtGakMfeykkeuaGP6V
      Kdk4I2jiXC22g/Zy7VAzbYdJTk96yWw71lpufQa1voy8ykCCu/YgeO4EjQME2RYn
      82W9+X4Qxx5bu0C0lKMwfdhAcR/MDTye0jbu33krwnuXsNyA+6OKBIOfIAWK8PWY
      iTwvkfQ+61T0dGFAdi8tJCfGZ6JRBf482KHR/gSwmwq59g7quS/snnybB6kGwrqZ
      tScHZ6Sy08xHYRbibV8HmOAyIBKZr1ZPtEjBx5Aj6Q4qKsTkZ3Q5ZTTi8Ayhm1SM
      y1mJ20d3B0WM9F48w0a8qbKxNn7zefW88QHq3PB6wdGechkZ/Wq0xN2z/h3Sl5W3
      ZSmJcvgMFJwc/p7ci2spkR+ibVnFNdvn0xinUvrJGftFuiEqlZfHwo1t6KkmX9st
      X7+30WwKmotxgeBfV0g1Br4YpaZTKJc5V2JkU+gtjnIlb/7XU6eWm+vCInad5QdL
      NeiYCPsrT9ejboKghAIteNNfiuauiRnpZ/06H5gi2OVeyChA1urD/pKjJyaNllbh
      XZTv9Wqzt6oQzR6FV0HH5H9ACqOnCJXsTUoydzt843MFHmPDL0Y=
      =77Yr
      -----END PGP SIGNATURE-----",
            "message": "redel rm.md
      ",
            "parent": Array [
              "91e66ded3cee73f5f181fbd0e7a4703f1c12bb9f",
            ],
            "tree": "7ab59df3bfd122ef5d24c70f9c8977f03b35e720",
          },
          "oid": "9a4eb099547166c9cf28628a127cfc9e59fa4f29",
          "payload": "tree 7ab59df3bfd122ef5d24c70f9c8977f03b35e720
      parent 91e66ded3cee73f5f181fbd0e7a4703f1c12bb9f
      author Riceball LEE <snowyu.lee@gmail.com> 1593652995 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593652995 +0800

      redel rm.md
      ",
        },
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593652652,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593652652,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl79NawACgkQEPFehIUs
      uGj7BRAAjZjpjaP6Kl++qtsHS5GdzMCVyocVOE+UCOWU55ImjJI9g2ajlnWfIUuM
      oZTFCG123eY0vGtXTCpcrNUPO3QvVtkIlZybMMFcJJMoENWjQ1rWZEVX4UK/skkM
      kKt1ZFVJHfgLnqsFGcyR5Fmr9omm3faVinyIxQhhdNxIYV44x4Uj5IszZul4yeQr
      NBdrPpmChT53ST3+WNp1/c7iSeMjUpXO+CVkmmG0kieThJgKBqkBTlholwYrVCgS
      B5MTgVzLh9NGoJHs+9Qd5pze41tIPNJbCWtWimoOdWJTo91L29qT747tNC14v6zh
      dkemZgUsO81lq96WiTekDS2E9PDWVWk1mi2XAXrsQ8OqDKYDwkLQa4GvlxjQrNEU
      1FG0btHD0ddYYEwBN4uK5wsXA60i1qDetggGT+CcYi2yX4MqFCI4GJgf4Oj0htht
      ltX7fMFZu5sKSOd1vLE8RxS2c4IgNQZ4ZFCAW1mfBAV31RLXG4BH1f/4laKvMrKO
      5EUufJcPIW4vKAXVVGyPMgenkEUrXL/ImYt1kuSAMx2pffahWQzaF7rTXAWO2YK+
      bqajFbubxMPbDPW70pnYQJLwuLve2IqBbPsMghx+B30F0PzCajg3XvJv7ZdqodSE
      wKn2DCea/8Rj7O/GYRPJJtJ8ITwhGMLxRC5s7j6mJAxj5IdB2fw=
      =z3mu
      -----END PGP SIGNATURE-----",
            "message": "feat: readd the rm.md
      ",
            "parent": Array [
              "1bc226bc219beea3fb177de96350d8ad2f4c57cd",
            ],
            "tree": "e7bd10ca01b3377fa6fbe633ce104698b5d7dd29",
          },
          "oid": "91e66ded3cee73f5f181fbd0e7a4703f1c12bb9f",
          "payload": "tree e7bd10ca01b3377fa6fbe633ce104698b5d7dd29
      parent 1bc226bc219beea3fb177de96350d8ad2f4c57cd
      author Riceball LEE <snowyu.lee@gmail.com> 1593652652 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593652652 +0800

      feat: readd the rm.md
      ",
        },
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
  it('a rename file with follow', async () => {
    const { fs, gitdir } = await makeFixture('test-log-file')
    const commits = await log({
      fs,
      gitdir,
      ref: 'HEAD',
      filepath: 'a/rename1.md',
      follow: true,
    })
    expect(commits.length).toBe(4)
    expect(commits).toMatchInlineSnapshot(`
      Array [
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593510674,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593510674,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl77CxIACgkQEPFehIUs
      uGhgYg//c7Add1QPUgdVP11OSH9MGAyxjLes14+g6lyf+5raDa4bvQAgRVydiqbt
      yI9SKwDni7HkZUK9CrqDtGwivvDjNK7n0R+ebNXRa4LYPrm9v9Htd6AqFNpSU6LG
      Fvi/AQarINtnSt7prKAExgf4Dt9Q9tZrVLqNIxi/6AMq3yQHwcDb6hKubaAkXWdw
      fkjmkUKtSSzycUy2HdrDSWX04frjN9ostqZHWQRvEztI1DdStwMIGMWibDioJoi+
      xlT1I28NvRtF0hgGgjFUQoa5xN7WwVYpx2byXQdfFavhZxqfQjnR0MMyIouIBxGQ
      aQGQNNEAgzVCMcnbTynLyZuG31daIS55AuoHS73RlTn+cJey32oblvnWRje9x7Vo
      J52QpRJPu4CTWQM75vc43n9acZYxATNCr/tEW8SIb4PVR5q0lfh6M1+MyfHxNJrp
      iRLkZaOlSsXxdU+oV5rcFg7YlpDIaqHBWTHjffqSUvBQ26S0Wot5W/kNkua35qcl
      S4fomYCphl/zAxyp+O31MQYCS36MObIM3FXEGdfm1c6XWtrAhtMPTKtsk5YB2ltP
      7MmLM1OwKltT6b55+RUnmQ4GyN92xIop9JMgDNDQfln/TRW73DaDFZt7OyZOZxQm
      qkdT/ALm0qLz8iPf4q0zBbSd0e4RnYxD0FwfPQ7aVMAA77hzMoA=
      =1cFE
      -----END PGP SIGNATURE-----",
            "message": "update rename1
      ",
            "parent": Array [
              "cc9bcf734480b44d2e884ae75a11805e42c938d8",
            ],
            "tree": "7ab59df3bfd122ef5d24c70f9c8977f03b35e720",
          },
          "oid": "1bc226bc219beea3fb177de96350d8ad2f4c57cd",
          "payload": "tree 7ab59df3bfd122ef5d24c70f9c8977f03b35e720
      parent cc9bcf734480b44d2e884ae75a11805e42c938d8
      author Riceball LEE <snowyu.lee@gmail.com> 1593510674 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593510674 +0800

      update rename1
      ",
        },
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593510498,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593510498,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl77CmIACgkQEPFehIUs
      uGi8fQ//VBw8UB5s5UvklkBbhhF/D6UsaH8ry1GU5fQoUZlf7ouBiKkdLv0Sqe7P
      dTsohbo1FGHK/+shXddsL9fsp9yQgySt0Zck7HcG2hM8TyeHycsHIZf2jdkfqWob
      3mjl2YoQLnht5z5+PoN7mHm6a4cNqFpKnQsHXuIMKjZLnvGDkgUOlxCiNrFsMmAx
      sho1ROVR+TCkSi8KrR66CvA6a8sIRVib7Y93WX7QgpFQgw24ZbpZvlDR0TjullLi
      df+9TBOEg89oZFtPBvpdURFSKltl6PMS7WnAoXgIFRAnwM5PnPZHkA37GanmSrj8
      awLBkCapWuTF4/K+Bhu5hfURRac6IPJi56ygQWKpThAwk3h2L/saKTJFqD9vb/Go
      +FM/fmex3lOGbVbZs1EtvkKwYIAb9pWKIcsnpzH6L6PrQE7DsLX2NP23hwMsXRt6
      9vQDUuY8Dd45ttM8XPcVP0bM5C4PqmCErxXVFLcuLUtkF98RaUNnEdkDCo0yfojF
      eQqn74zmQ0c3Q4WufxKM+4kQ1EflScv4uxOuBraj3hFcyac4u1CyLD0sv7InkdRB
      T0iS+pLIyaJQIHV4AximpRISitVGuYnNtSuTrJJDmjmGGSMyC/jCsDrr1t0lMxdb
      vdDuh3t+Ch9rvXHEPtnIokOW9U+hrVIeIGeiD0KM5QHD2CjcgwQ=
      =2hns
      -----END PGP SIGNATURE-----",
            "message": "rename it
      ",
            "parent": Array [
              "b9a8e7ed4e394942ba0a45f19563e8ad90b94ea9",
            ],
            "tree": "641ca0a41cfbccf4fb5c366840270fd25ec48b4f",
          },
          "oid": "cc9bcf734480b44d2e884ae75a11805e42c938d8",
          "payload": "tree 641ca0a41cfbccf4fb5c366840270fd25ec48b4f
      parent b9a8e7ed4e394942ba0a45f19563e8ad90b94ea9
      author Riceball LEE <snowyu.lee@gmail.com> 1593510498 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593510498 +0800

      rename it
      ",
        },
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593510465,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593510465,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl77CkEACgkQEPFehIUs
      uGiGZA//Y5XlL5XeP05m7Jp2h2GBOc1nF6W7AAxRUSintdiX706aaoSAbVD3PwB3
      zMuGiBIePPvQk+Oo+U8E0h2cD0bIY13BHJ+z23Qmn/1I1Vtup9uuWRCDR7T1Gy0r
      3rUsdtyuZ3qIjliCP/j5254x6hspIUVBFUeHd/BWTWIimKIuYKRg8am9qNn2Dhir
      o889/ZKuImsgF1eNsIaqlWN71n8KUGmDNcTdQ7eZzk4wUSsASyWRvnr3+OYkhjTp
      ffJubsdA+FvixxCM8kg6UAoOFlMzJapVi/AdLXRQ6758tEpTPWdz2WVxrI3P1ACq
      HzqvSIDoEISZDkKw/5maL9/89dV0qSuJcv3EqZQKxB3I7DAQgseHBAgThtChtdkh
      a6OrCIkeJyNjQhgXpqtIJ71P6mVTDNnveDWO+9OilCrHfLa3nqYCz+xPZ2txRwG/
      Z6+491WZVJAzU9rICT9AvrDpllacofr95LZCYdLd5J6qTYxq4m92AoZLOq5iKH1w
      nCYyrfswZolEmbq50MhD7JdZKE3IPf5sfZfU+X4EfPYkr//P5M6wGzYVXYv6KttJ
      jsekDsWczkATsKkp0xiC0lRVMNYwxl2Ly03JBZ/U2lBWEKhDgz1ELKa1XM9qEqSH
      CbwmGwIWyAOFmjkBjWUHIqrm2zQFskpXu4a+03dqV5pCQlsf4qs=
      =qvhP
      -----END PGP SIGNATURE-----",
            "message": "update rename
      ",
            "parent": Array [
              "01cd249eaaceb8572bee5b24d8ed728c95f61bd6",
            ],
            "tree": "b76aafd52bf2d588756a32ebc9fa1ae0e68052c9",
          },
          "oid": "b9a8e7ed4e394942ba0a45f19563e8ad90b94ea9",
          "payload": "tree b76aafd52bf2d588756a32ebc9fa1ae0e68052c9
      parent 01cd249eaaceb8572bee5b24d8ed728c95f61bd6
      author Riceball LEE <snowyu.lee@gmail.com> 1593510465 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593510465 +0800

      update rename
      ",
        },
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593510416,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593510416,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl77ChAACgkQEPFehIUs
      uGj/rxAAtVD1LSNM4gfyHQQB8G/E4JWmqoTlOJlC2s+zZRzMUgKPPqItt4p4FFMs
      4GstDmVhGVKNpZjCkzZUX5N2Htm6PzWDdjtI5t+yl1rLfCR73VQKA/ztdUT2w1tg
      jewPYRht9VrP46MqCxbnUpdt5zYhshGa3/Q9WRy11rakvjrbF9S9jKP+qiNyS1X2
      3LGyDNQlS7XymSUFz4PSiOVTEpkSoOuGM6PnOhzmdNgl/JPY2vVCFcejO+qDq2K+
      0EbLH6Ab0r7EiFQXufOSR0m6i3SXnfg66+ttiW5Olm2yfT0H05flvHUp93aeAoYf
      qOvnSR5nX4jzQaLyHBvSWlotNfAgLSgLVZlUSoShYjRm/4UuFShZn546ykEZ1vTZ
      rMU5PNvu8pqhCEneHnl7WEuxrlxt10vwtzWDUalaUZgNKXoIYDWISpVfzdOEuOu3
      xNaH1GwZuGEtGZbDwOzsdTkJC5OTRzkb5c0SF/wlCUaW6rWW0J1cc/PX3bi4euwH
      TdUe8v0KT2jX275FjpzvCQixduMrM9lm6vwOYSWplk6Au+v5ot2vaGob2ok5dMIP
      Ai2oopT87heuC/iPcL2DKES1TItiXbRvYYu6jB3qCxD2cQUFxXgYyTuAnS3uSnhx
      w89ElnO5qtr32gZ5+609hodFg8zrxZWxXxpNcIHfTgh17qHZuPg=
      =iSgt
      -----END PGP SIGNATURE-----",
            "message": "add rename.md
      ",
            "parent": Array [
              "2584400512051e6cb07fda5ff7e8dde556fc3124",
            ],
            "tree": "8ad18556d7692aef283e7cf30a287b6010c362a4",
          },
          "oid": "01cd249eaaceb8572bee5b24d8ed728c95f61bd6",
          "payload": "tree 8ad18556d7692aef283e7cf30a287b6010c362a4
      parent 2584400512051e6cb07fda5ff7e8dde556fc3124
      author Riceball LEE <snowyu.lee@gmail.com> 1593510416 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593510416 +0800

      add rename.md
      ",
        },
      ]
    `)
  })
  it('a rename file forced without follow', async () => {
    const { fs, gitdir } = await makeFixture('test-log-file')
    const commits = await log({
      fs,
      gitdir,
      ref: 'HEAD',
      filepath: 'a/rename1.md',
      force: true,
    })
    expect(commits.length).toBe(2)
    expect(commits).toMatchInlineSnapshot(`
      Array [
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593510674,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593510674,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl77CxIACgkQEPFehIUs
      uGhgYg//c7Add1QPUgdVP11OSH9MGAyxjLes14+g6lyf+5raDa4bvQAgRVydiqbt
      yI9SKwDni7HkZUK9CrqDtGwivvDjNK7n0R+ebNXRa4LYPrm9v9Htd6AqFNpSU6LG
      Fvi/AQarINtnSt7prKAExgf4Dt9Q9tZrVLqNIxi/6AMq3yQHwcDb6hKubaAkXWdw
      fkjmkUKtSSzycUy2HdrDSWX04frjN9ostqZHWQRvEztI1DdStwMIGMWibDioJoi+
      xlT1I28NvRtF0hgGgjFUQoa5xN7WwVYpx2byXQdfFavhZxqfQjnR0MMyIouIBxGQ
      aQGQNNEAgzVCMcnbTynLyZuG31daIS55AuoHS73RlTn+cJey32oblvnWRje9x7Vo
      J52QpRJPu4CTWQM75vc43n9acZYxATNCr/tEW8SIb4PVR5q0lfh6M1+MyfHxNJrp
      iRLkZaOlSsXxdU+oV5rcFg7YlpDIaqHBWTHjffqSUvBQ26S0Wot5W/kNkua35qcl
      S4fomYCphl/zAxyp+O31MQYCS36MObIM3FXEGdfm1c6XWtrAhtMPTKtsk5YB2ltP
      7MmLM1OwKltT6b55+RUnmQ4GyN92xIop9JMgDNDQfln/TRW73DaDFZt7OyZOZxQm
      qkdT/ALm0qLz8iPf4q0zBbSd0e4RnYxD0FwfPQ7aVMAA77hzMoA=
      =1cFE
      -----END PGP SIGNATURE-----",
            "message": "update rename1
      ",
            "parent": Array [
              "cc9bcf734480b44d2e884ae75a11805e42c938d8",
            ],
            "tree": "7ab59df3bfd122ef5d24c70f9c8977f03b35e720",
          },
          "oid": "1bc226bc219beea3fb177de96350d8ad2f4c57cd",
          "payload": "tree 7ab59df3bfd122ef5d24c70f9c8977f03b35e720
      parent cc9bcf734480b44d2e884ae75a11805e42c938d8
      author Riceball LEE <snowyu.lee@gmail.com> 1593510674 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593510674 +0800

      update rename1
      ",
        },
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593510498,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1593510498,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl77CmIACgkQEPFehIUs
      uGi8fQ//VBw8UB5s5UvklkBbhhF/D6UsaH8ry1GU5fQoUZlf7ouBiKkdLv0Sqe7P
      dTsohbo1FGHK/+shXddsL9fsp9yQgySt0Zck7HcG2hM8TyeHycsHIZf2jdkfqWob
      3mjl2YoQLnht5z5+PoN7mHm6a4cNqFpKnQsHXuIMKjZLnvGDkgUOlxCiNrFsMmAx
      sho1ROVR+TCkSi8KrR66CvA6a8sIRVib7Y93WX7QgpFQgw24ZbpZvlDR0TjullLi
      df+9TBOEg89oZFtPBvpdURFSKltl6PMS7WnAoXgIFRAnwM5PnPZHkA37GanmSrj8
      awLBkCapWuTF4/K+Bhu5hfURRac6IPJi56ygQWKpThAwk3h2L/saKTJFqD9vb/Go
      +FM/fmex3lOGbVbZs1EtvkKwYIAb9pWKIcsnpzH6L6PrQE7DsLX2NP23hwMsXRt6
      9vQDUuY8Dd45ttM8XPcVP0bM5C4PqmCErxXVFLcuLUtkF98RaUNnEdkDCo0yfojF
      eQqn74zmQ0c3Q4WufxKM+4kQ1EflScv4uxOuBraj3hFcyac4u1CyLD0sv7InkdRB
      T0iS+pLIyaJQIHV4AximpRISitVGuYnNtSuTrJJDmjmGGSMyC/jCsDrr1t0lMxdb
      vdDuh3t+Ch9rvXHEPtnIokOW9U+hrVIeIGeiD0KM5QHD2CjcgwQ=
      =2hns
      -----END PGP SIGNATURE-----",
            "message": "rename it
      ",
            "parent": Array [
              "b9a8e7ed4e394942ba0a45f19563e8ad90b94ea9",
            ],
            "tree": "641ca0a41cfbccf4fb5c366840270fd25ec48b4f",
          },
          "oid": "cc9bcf734480b44d2e884ae75a11805e42c938d8",
          "payload": "tree 641ca0a41cfbccf4fb5c366840270fd25ec48b4f
      parent b9a8e7ed4e394942ba0a45f19563e8ad90b94ea9
      author Riceball LEE <snowyu.lee@gmail.com> 1593510498 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1593510498 +0800

      rename it
      ",
        },
      ]
    `)
  })
  it('a rename file with follow multi same content files', async () => {
    const { fs, gitdir } = await makeFixture('test-log-file')
    const commits = await log({
      fs,
      gitdir,
      ref: 'HEAD',
      filepath: 'rename-2.md',
      follow: true,
    })
    expect(commits.length).toBe(2)
    expect(commits).toMatchInlineSnapshot(`
      Array [
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1594594854,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1594594854,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl8LliYACgkQEPFehIUs
      uGgGvBAAy4yXnK1dpMDe0x4fzWcNo9r5Ong/UFPBN8Wda0OMivmg7RbhmF1ZJxwS
      J+IuSSVyunnFGqJPE6kF+CdNlCVC/Ol7LJV2rYIi+R+EBVLjU+eW1i6lSRCzJlPt
      rwyWsLzvNWWsA8S88ndHMvNcr9NliSepsdXsF0dbbjru5aHct9Crvz9blb9q8WrN
      yc2HLtE7TliPCxfNBqz5I2aLYwfjcEQbdnMYXQfseJBI1md0qzupY5YKkYTA+Yuf
      1yEcPEOsACNrSalCTGooMgfKBC051HBnUVebAfdqUeR6XHjl6fVHTRsMKETsBQeH
      hIHuN+dKjdX1zvzXbq3IStXTvTLAnK5f5td866FRvkuuTki3BiWYq/AfpwchpKKt
      S3HkZnPhQXvOBSyYwI6fz+leZvpJDp+HjGDiNbB+H6iO1rDc7tVTzGKVniRsXVKJ
      /L/OkP0B5pt+ElSGrlQ38Mk5uN0xtnbGPGCA074Tgry/rC8G5E8x9a1ZbsO5lQ1g
      WuDwTuyzPlb6fxrctGPBI7yD+dxx/xIRjXkMRUo3GwcQSzTALl+x63SxOl4AfvmQ
      Hyh2/osfJh8YUd67QDSQOY0tagXodZhAT4YkfXhqehHOBQ1Sc4GZI5wT/7nn0NTy
      CP5jdSuA/wAIac/vGIQ89C71keAlKMgeEVrDOh6PISUGp4q8wy8=
      =dlF4
      -----END PGP SIGNATURE-----",
            "message": "rename rename2 to rename-2
      ",
            "parent": Array [
              "c7a666607cd986eee187b3df2c4adef3b7e56c94",
            ],
            "tree": "2d8cf1942da4577aa3f205108c228e1a95b33940",
          },
          "oid": "18f202dfed5cb66a295dc57f1f4ba1b7f6b74f36",
          "payload": "tree 2d8cf1942da4577aa3f205108c228e1a95b33940
      parent c7a666607cd986eee187b3df2c4adef3b7e56c94
      author Riceball LEE <snowyu.lee@gmail.com> 1594594854 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1594594854 +0800

      rename rename2 to rename-2
      ",
        },
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1594594440,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1594594440,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl8LlIgACgkQEPFehIUs
      uGjWiA/+Oda2OuPc7X9TFgDvnAwIWMRFThUebrGe2NaVstvtAAHte3Y/9FYqU062
      0IWLycCENb7EbSTlIb6Lew09KXibnB4E39WrIcWYJJx2zICETNW56yedkd+1UJKZ
      XwCewsgxyOVA960awxyLa2au06aHDF8U6128lHPZDVYIVgdYzhrn+18j+TXc4anB
      p1whk5vAq7nkdTS0yATbLvlbBgymKaDxsGM7RO1giFSVQxzULb0RyH1BfnvkV4Ox
      QxkyMPIYuziZXBpYBZmZOdIq1E5zOVkyoQIELpXy8NrLZ4Wj+r2P9RujdlA6zitA
      xaeihDikZNRQc1vPsb119psabrrgXY/dxW9+p60kSXsUGWhX5RBKuPodfmpRHJTD
      XKe5lckrPTUkCwbVMGXUx2nj9jCcF5FEMDQKEd/dBFKX9QPY6JnjaimIY1E8ulAX
      rwXN91oECmt5OvPI2icOYLCkPkbNMy8rW3hEu4QDj8bCfPBtgHhon9SIsWKE6Bh9
      sRLGU9cJWFPXNlyV9nj3G2w5MXrzm2SqJrxH/reuDdkB1Y2kYMM5pSNmlS1+IGk8
      mTkYjlsCT4WxHRyyMJUtGxvdTisyp2odP7BEcEjq97ZHKKgUDtTbsmD0tfo0k0eL
      KBa7eI7ag4KMAJ4MWk3X70f2qAeoaSNXAsYDSI+kt/rFgFsYSH0=
      =AaPG
      -----END PGP SIGNATURE-----",
            "message": "add rename2
      ",
            "parent": Array [
              "9a4eb099547166c9cf28628a127cfc9e59fa4f29",
            ],
            "tree": "795c22aa0265ce8c2d1cd3d4bf2d62ac1605b5ca",
          },
          "oid": "f44bab8dd4229486c7f6acc448cfc158bcbe5cfd",
          "payload": "tree 795c22aa0265ce8c2d1cd3d4bf2d62ac1605b5ca
      parent 9a4eb099547166c9cf28628a127cfc9e59fa4f29
      author Riceball LEE <snowyu.lee@gmail.com> 1594594440 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1594594440 +0800

      add rename2
      ",
        },
      ]
    `)
  })
  it('a rename file2 with follow multi same content files', async () => {
    const { fs, gitdir } = await makeFixture('test-log-file')
    const commits = await log({
      fs,
      gitdir,
      ref: 'HEAD',
      filepath: 'rename22.md',
      follow: true,
    })
    // expect(commits.length).toBe(2)
    expect(commits).toMatchInlineSnapshot(`
      Array [
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1594594611,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1594594611,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl8LlTMACgkQEPFehIUs
      uGhUxhAAl4RTZr0osT5fs+bT/X5Ru2PvWyB8MJhc7Qy3nGQmpowqqlmU5UD+BKRI
      oQfzGmZ7hKNRegS51HcNsv/kPqEA7maAAFDTqCKUFbLdeMKTf0vPCx90+U5hUamd
      n3sLVK9lSSkz0FF3nVD28Fmcrh6oxHY4XQ/KHVBD8PZyIJ2DB4rYpqYB1p7Mx1LO
      1mlMfru1J5Nc6DF+n6tANn95opkgwDjtPJkThZTfWDHQGy6mAJXbp0TChef/Rx+G
      BegdvrkkMjP/Gq/+2b5LHEZb0Anode5zAYdz2J/SeqD2OiRvvR7nG0wVZAe6z7ZD
      StnVFtTa0zaAGhxps6teyWEK3dtBkmybxs/1PbEDZcyFN3LYmOSSpIpoyU4S2m19
      0Q3keZnyP2d3qajlgg25uW8ejh31TomcbQZ6n0VXqxysPpLAj394iFNt1ZKRrkFZ
      rBKWTwhYYhzBAb3qMPAiOpN6UnTVzeeGrc5mN3DSh3WAPUOQmwTxFp9gkpWr7mgN
      a3OZnSGg+7/fNUW8XUFyPIhud2C3BCDrm77bZPlHTZpZT31dWUxm30mIIM+wn3rF
      LUmPaXY6jbCbig0Y0wAL+K+8ELs/XC7RJC70IRtYuXKnP2H9dE483cssmFALOTjF
      2AikacC0uRtiJdMAe/YcFNzfYxEUo20Amkk3iutUAN+/kTlMNrM=
      =WpAk
      -----END PGP SIGNATURE-----",
            "message": "update rename22
      ",
            "parent": Array [
              "c87ae5071b9e674a1cfa3d853e33993c162c5def",
            ],
            "tree": "6ae7cfe2d19e1ab121ec7c31fac66f33f1ef9957",
          },
          "oid": "c7a666607cd986eee187b3df2c4adef3b7e56c94",
          "payload": "tree 6ae7cfe2d19e1ab121ec7c31fac66f33f1ef9957
      parent c87ae5071b9e674a1cfa3d853e33993c162c5def
      author Riceball LEE <snowyu.lee@gmail.com> 1594594611 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1594594611 +0800

      update rename22
      ",
        },
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1594594590,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1594594590,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl8LlR4ACgkQEPFehIUs
      uGgjuhAAxg/R9VUR69KDvtfI4dYffv/Oj36FYsEeBPTY1Gdy3p4fgXDaQ0D4KE4+
      XOPKj25EKlydR0iDu9Uc3WxsXmfON0p1YChMiO8+YZojEQVbSkfOECnznOuK8VfR
      6V7nIVJr9apYCGUeU80ZN22Ax1KlpVC9mkN+7VejAGKgf374URUvGoKBXuEAEkve
      Bq54EJdWhWX5wg2fN88NXLf0kHYchM2vyVC5L2cNpIq3UxZ5SK8KCQoxgr7fst2a
      RymJz8sQpKJiprv+D1YYCjONX8bqtFroy0aK/3RMKZ0bDm5IQq749C6ptDjd3uSW
      ojzGuWMA6W8BAuM5Dj+5rxIHH+DXv3h/Q0kFbNYfS9/dnmXR0jzQaAlf7VaGvMXT
      1UfCrrvLnbqy1Sc17xaUav7QQ46Yl22VF1gN8DCfol1i8IP0z6QsOWY+53Ok3t4C
      X73OgGXqijP9BBgLIS9CplefV+oQX7Tyjw/jT3YdHRThPetxbtFgknjTrZ/2UlVo
      kkBdrNNEk8mGMYZC1VljCdHEEWGl/GJEqaqoN3OdkJFkCge4qFHPjo10x9n3Qv5K
      Zp0JYtM/roKelfUJh75p2OZoSMCV+jT+PoVPh3mCstSNCSt+2OSwTzFqQphRbU44
      a38BGcs3PtlZIQuHDprQC93YYdRYZ7DvDbWEgGNcmOY24/4+qUY=
      =7Pky
      -----END PGP SIGNATURE-----",
            "message": "rename rename2-2 to rename22
      ",
            "parent": Array [
              "b3886fec49477755dcc5591c8df04f66535c0d79",
            ],
            "tree": "b5d1f7500bb4d6dd31b70c19c2ddf89955a3e509",
          },
          "oid": "c87ae5071b9e674a1cfa3d853e33993c162c5def",
          "payload": "tree b5d1f7500bb4d6dd31b70c19c2ddf89955a3e509
      parent b3886fec49477755dcc5591c8df04f66535c0d79
      author Riceball LEE <snowyu.lee@gmail.com> 1594594590 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1594594590 +0800

      rename rename2-2 to rename22
      ",
        },
        Object {
          "commit": Object {
            "author": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1594594501,
              "timezoneOffset": -480,
            },
            "committer": Object {
              "email": "snowyu.lee@gmail.com",
              "name": "Riceball LEE",
              "timestamp": 1594594501,
              "timezoneOffset": -480,
            },
            "gpgsig": "-----BEGIN PGP SIGNATURE-----

      iQIzBAABCgAdFiEEdmCAADTKSYRxNh/nEPFehIUsuGgFAl8LlMUACgkQEPFehIUs
      uGhLsBAAorySvEQFjCKL1kIi2fJyF4xWcnbzlO2xd6HWaSB6VQZZZwrGQIRFOoVX
      ExiOzHrcmcXrdH2so3hlLS7XjlmI3oGSKDxryscfe/wJEvRMr9flXAVIvQdMrG7T
      K/mNYKs5Pu/0oOQu+UMNZHWOjnABiW8VAhs16WwyNWndr9sE22F97cn1dmMESL/K
      W5OcpSkH3JuEaZTYSwbyyO8SYeLacyyBmKvqT0NBzt7mcZa0P/qAKWRWcmV5mQn+
      pWB2EB2m7bwG09xjlyMwwDnVlbYfv7s2xz8pBLh2n+ye1d4roghTiGbCGjIe+CAy
      8/lrwpARQNiXig3aaLNs7n//EaIkds8MWxygJk7tKwJTMPWF3mzM6k06XJKlKD9r
      2JjTIRpmF01TdjUou8CLTNsfky1f4zCWUb5CNMReyvZellBFUDfh148Q3WlxDDVK
      /XuHWIpr1mlzbYhXBWARJ4DMnqNWP6bL9Eo5ne9tbGFzh2rlitfzJdkMNwJ2QBKW
      rbIy7jSEcpKDYUshg3VcbUkAKxCD4i2VWwDfTxzxwMiD6rWvP6Ig7seqj8Tfy2LU
      ppVZj8VIxSQ5FH4s1MDbgHRyHz3OV+WS4MMLpdE8hhf8ZXFqlD+5b28ILEVO3EL3
      kA3hblT2W8wSVy4NLzxf+inLsQ7UcU/qAAskaEG1sryZqkEZojI=
      =bJdJ
      -----END PGP SIGNATURE-----",
            "message": "add rename2-2
      ",
            "parent": Array [
              "58ebbeb4ea12bf4b0bdedfdf89e3d8c8f456e094",
            ],
            "tree": "84230a4664bf41b53034b9cab3c823db721055eb",
          },
          "oid": "6f2d819bb115a70fa9d831717d32ce2bdec3b83b",
          "payload": "tree 84230a4664bf41b53034b9cab3c823db721055eb
      parent 58ebbeb4ea12bf4b0bdedfdf89e3d8c8f456e094
      author Riceball LEE <snowyu.lee@gmail.com> 1594594501 +0800
      committer Riceball LEE <snowyu.lee@gmail.com> 1594594501 +0800

      add rename2-2
      ",
        },
      ]
    `)
  })
})
