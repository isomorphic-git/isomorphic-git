---
author: William Hilton
authorURL: https://twitter.com/wmhilton
authorFBID: 551965935
title: Contributing Workflow
---

I have gotten questions along the lines of "how do I get started working on the code"?
So I thought I would walk through what my development process looks like.

Step one: Pick an issue.
Today I feel like knocking out an easy bug that I should already know how to fix.
I will work on [Error when committing without "author" #107](https://github.com/isomorphic-git/isomorphic-git/issues/107).

Step two: checkout the master branch and do "git pull --ff-only" to make sure I'm working on the latest code.
This is almost always necessary because the master branch is protected by robots and enforces a "merge only" policy, so you never push or work on the master branch directly.
(It gets updated through pull requests when they get merged.)

Step three: Create a new branch with a descriptive name.
I'm not feeling descriptive though so I'll break my own rule and just call the branch 'issue-107'.

Step four: Update the unit tests.
This is the Test Driven Development (TDD) part of the project.
90% of the time, and nearly 100% of the time for fixing bugs, I know what behavior I want to see in the end, even before I start coding.
In this case, I want attempting to make a commit without an author throw an error.

Here's what that test looks like.
It's in the "`commit`" function, so its tests go in the "`__tests__/test-commit.js`" file.
There is already a test for making a commit, so I'll copy and paste it and then modify it to assert it throws a specific error.

```js
it('throw error if missing author', async () => {
  // Setup
  let { fs, dir, gitdir } = await makeFixture('test-commit')
  // Test
  let error = null
  try {
    let sha = await commit({
      fs,
      gitdir,
      author: {
        email: 'mrtest@example.com',
        timestamp: 1262356920
      },
      message: 'Initial commit'
    })
  } catch (err) {
    error = err.message
  }
  expect(error).toBe('Author name and email must be specified as an argument or in the .git/config file')
  // reset for test 2
  error = null
  try {
    let sha = await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        timestamp: 1262356920
      },
      message: 'Initial commit'
    })
  } catch (err) {
    error = err.message
  }
  expect(error).toBe('Author name and email must be specified as an argument or in the .git/config file')
})
```

Now I run [jest](https://facebook.github.io/jest/) in watch mode, filtering against the "commit" test.
If I did it right, the test should fail.

```sh
> jest commit --watch
```

I forgot that the signed commit test with OpenPGP takes quite a while, and the "listCommits" test matches that filter too.
So it is 21 seconds before I get my lovely error:

```sh
 PASS  __tests__\test-listCommits.js (10.628s)
 FAIL  __tests__\test-commit.js (20.085s)
  ● commit › throw error if missing author

    expect(received).toBe(expected)

    Expected value to be (using Object.is):
      "Author name and email must be specified as an argument or in the .git/config file"
    Received:
      "Cannot read property '_named' of undefined"

      43 |     expect(error).toBe('Author name and email must be specified as an argument or in the .git/config file')
      44 |     // reset for test 2
    > 45 |     error = null
      46 |     try {
      47 |       let sha = await commit({
      48 |         fs,

      at Object.it (__tests__/test-commit.js:45:19)

Test Suites: 1 failed, 1 passed, 2 total
Tests:       1 failed, 3 passed, 4 total
Snapshots:   1 passed, 1 total
Time:        21.697s
Ran all test suites matching /commit/i.
```

That does match the error described in the Github issue #107 though, so I'm on the right track.

I open up `src/commands/commit.js`.
The first thing I notice is a bunch of JSDoc, which is a shame because I quit using JSDoc in favor of documenting
on the [website](https://isomorphic-git.github.io/docs/commit.html) using [docusaurus](https://docusaurus.io/).
I delete the JSDoc because having out-of-date documentation in the code is worse than having no documentation in the code.

The actual change is pretty simple:

```js diff
  
  // Fill in missing arguments with default values
  if (author === undefined) author = {}
  if (author.name === undefined) {
    author.name = await config({ fs, gitdir, path: 'user.name' })
  }
  if (author.email === undefined) {
    author.email = await config({ fs, gitdir, path: 'user.email' })
  }
+ if (author.name === undefined || author.email === undefined) {
+   throw new Error('Author name and email must be specified as an argument or in the .git/config file')
+ }
  
```

I hit File > Save and presto:
```sh
 PASS  __tests__\test-listCommits.js
 FAIL  __tests__\test-commit.js (10.565s)
  ● commit › throw error if missing author

    expect(received).toBe(expected)

    Expected value to be (using Object.is):
      "Author name and email must be specified as an argument or in the .git/config file"
    Received:
      "Cannot read property '_named' of undefined"

      43 |     expect(error).toBe('Author name and email must be specified as an argument or in the .git/config file')
      44 |     // reset for test 2
    > 45 |     error = null
      46 |     try {
      47 |       let sha = await commit({
      48 |         fs,

      at Object.it (__tests__/test-commit.js:45:19)

Test Suites: 1 failed, 1 passed, 2 total
Tests:       1 failed, 3 passed, 4 total
Snapshots:   1 passed, 1 total
Time:        11.563s
Ran all test suites matching /commit/i.
```

Really? Oh, right. I'd already [figured out](https://github.com/isomorphic-git/isomorphic-git/issues/107#issuecomment-374827138)
that this bug stems from the config parser, not the commit function itself, as can be seen from the stack trace in the original bug report:
```js
models.js:440 Uncaught (in promise) TypeError: Cannot read property '_named' of undefined
    at isNamedSection (models.js:440)
    at GitConfig.get (models.js:460)
    at config (commands.js:135)
```

Right. To the config parser! In this case it is *not* in `src/commands/config.js` but in `src/models/GitConfig.js`.
(The stack trace says `models.js` instead of `GitConfig.js` because node is running the files compiled in `dist/for-node` which
have each folder `commands`, `managers`, `models`, and `utils` rolled up into standalone files.)

I look at `isNamedSection` first since the error starts there.

```js
const isNamedSection = section => schema[section]._named
```

OK, so `schema[section]` must be undefined when section = "user".
I do not want isNamedSection to ever throw...
(and here is where I think "Maybe I really should use TypeScript..." but bury the thought)...
so I will change that.

```js
const isNamedSection = section => schema[section] && schema[section]._named
```

Ctrl+S.

```sh
 FAIL  __tests__\test-commit.js (10.673s)
  ● commit › throw error if missing author

    expect(received).toBe(expected)

    Expected value to be (using Object.is):
      "Author name and email must be specified as an argument or in the .git/config file"
    Received:
      "Cannot read property 'name' of undefined"
```

I can't say I wasn't expecting something like that.
I go look through the GitConfig.get method to find and fix the likely culprit:

```js diff
  // Cast value to correct type
- let fn = schema[section][key]
+ let fn = schema[section] && schema[section][key]
```

(Because `schema['user']['name']` would be `undefined['name']` resulting in "Cannot read property 'name' of undefined".)

Ctrl+S.

```sh
 PASS  __tests__\test-listCommits.js
 PASS  __tests__\test-commit.js (10.786s)

Test Suites: 2 passed, 2 total
Tests:       4 passed, 4 total
Snapshots:   1 passed, 1 total
Time:        11.797s, estimated 12s
Ran all test suites matching /commit/i.
```

Alright! Tests pass, which means `GitConfig.get()` isn't throwing but returning undefined when the author is missing,
and therefore our guard in `commit.js` works and throws our helpful
'Author name and email must be specified as an argument or in the .git/config file' error.

I run Ctrl+C to kill jest, then `git diff` to review my changes.
They look good (I do not see any temporary changes that I made and forgot to remove) so I go ahead and commit.
I do not need to mention the issue # in the commit message, because I will have a chance to refine the commit
message later using the Squash and Merge button in the PR.
[Editor's Note: I probably *should* have included the issue # here.]

```sh
> git add -u
> git commit -m 'fix: Throw meaningful error message from "commit" if author is missing'
husky > npm run -s precommit (node v9.7.1)

found 0 sensitive files

[issue-107 a7d7b55] fix: Throw meaningful error message from "commit" if author is missing
 3 files changed, 42 insertions(+), 29 deletions(-)
```

[Husky](https://github.com/typicode/husky) runs a precommit check to make sure no sensitive files like private SSH keys are being committed.
(Husky is just one of many robots I use to help maintain isomorphic-git.)

I push the branch, which triggers another automated scan:
```sh
husky > npm run -s prepush (node v9.7.1)

nps is executing `lint` : nps lint.js && nps lint.typescript
nps is executing `lint.js` : standard src/**/*.js
nps is executing `lint.typescript` : tsc src/index.d.ts
Counting objects: 9, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (9/9), done.
Writing objects: 100% (9/9), 1.70 KiB | 289.00 KiB/s, done.
Total 9 (delta 8), reused 0 (delta 0)
remote: Resolving deltas: 100% (8/8), completed with 8 local objects.
To https://github.com/isomorphic-git/isomorphic-git
 * [new branch]      issue-107 -> issue-107
Branch issue-107 set up to track remote branch issue-107 from origin.
```

(If the linter had found any style problems, it would have fixed them using prettier.
I have not automated amending the commit though, so I would have to fix the commit with
`git add -u && git commit --amend --no-edit` and try pushing again.)

Since it succeeded, it will show up on the [Github page](https://github.com/isomorphic-git/isomorphic-git)
near the top, under "Your recently pushed branches:". I go there and click the "Compare & pull request" button.

By default, Github uses the commit message as the PR title, which is usually fine.
However, now I will tack on "(fixes #107)" to the end of the title just so Github automatically creates a hyperlink between
the issue and the PR.

... I lied. Github is not smart enough to use the PR title. :eyeroll:
I edit the PR description to be "fixes #107" and _then_ Github adds the "wmhilton referenced this issue a minute ago" link to the PR to the issue.

Now we wait for the Continuous Integration (CI) system to do its thing.
I didn't actually check if it would work in the browser -
which we could have done by running `npm run test` (which will run Jasmine and Karma) instead of just `jest` -
and in fact we didn't run the entire test suite in jest -
but I am pretty confident that the changes I made won't break anything.
The CI system will verify that. It uses [Travis CI](https://travis-ci.org/isomorphic-git/isomorphic-git/) and will
run the full gammut of tests, from ensuring the code is in [Standard Style](https://standardjs.com/) (which husky already
checked during the pre-push check) to testing it in real browsers via [Sauce Labs](https://saucelabs.com/open-source).
Because Travis-CI creates two builds: one for the 'issue-107' branch as-is and one for the PR which tests how the repo would be
if 'issue-107' is merged into 'master', it takes twice as long. (Because there is a concurrent connection limit with Sauce Labs,
I have to run Travis tests one-at-a-time or risk the Sauce Labs tests timing out.)
It takes about 10 minutes per build, so realistically it will be at least 20-30 minutes before we get the green light to merge the PR.

Not all of the CI statuses have to be green to merge.
Specifically, the required statuses that a commit must pass are:
- Node Security (a vulnerability scanner)
- Snyk (another vulnerability scanner)
- Travis CI (unit tests)

The optional statuses are:
- Codecov (test coverage)
- bundlesize (whether the bundle size increased)
- License Compliance (reports any licensing issues in dependencies)
- ... and more as I discover more helpful robots and commit scanners

Github gives you three choices (Create a merge commit, Squash and merge, or Rebase and merge) when you merge a PR.
I generally go with Squash and Merge because (unlike rebase and merge) it lets you edit the commit message,
and it results in a smaller master branch. It looks like Github has again chosen the commit title, not the PR title, as the suggested Squashed commit message, so I
change "(#118)" to be "(fixes #107, PR #118)" and click "Confirm squash and merge".

I delete the branch (issue-107) right afterwards, so it doesn't hang around.
Because the commit starts with the keyword "fix:" [semantic-relase](https://github.com/semantic-release/semantic-release)
will automatically increment the patch version number and publish the build on npm, in about 10-15 minutes once the CI
tests pass.

Meanwhile, [issue #107](https://github.com/isomorphic-git/isomorphic-git/issues/107) has been automatically closed, because our commit had "fixes #107" in its title.
Once semantic-release publishes the release containing this fix, the semantic-release bot will even leave a comment on the issue
(under my name, because of the OAuth token I guess) saying "🎉 This issue has been resolved in version 0.9.9 🎉".
This is great for both the original bug report contributor, and future users stumbling across the bug report via search engine,
wondering whether their version of isomorphic-git has the fix.

And that is how I do it! Thank you if you read this far. As Mark Twain might have said, "If I had more time, I'd have written a shorter blog post."
