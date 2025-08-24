---
title: Frequently Asked Questions
sidebar_label: FAQ
id: version-1.x-faq
original_id: faq
---

## FAQ philosophy

Most frequently asked questions will get turned into code.
For instance, ["How to get the current branch?"](/docs/currentBranch.html) and ["How to list all the files in a commit?"](/docs/listFiles.html) used to be two frequently asked questions.
So this FAQ is kind of small

- [FAQ philosophy](#faq-philosophy)
- [Is this based on `js-git`?](#is-this-based-on-js-git)
- [How does this compare with `nodegit`?](#how-does-this-compare-with-nodegit)
- [How does this compare with...](#how-does-this-compare-with)
- [Why is there no `default` export in the ES module?](#why-is-there-no-default-export-in-the-es-module)
- [How to add all untracked files with git.add?](#how-to-add-all-untracked-files-with-gitadd)
- [How to make a shallow repository unshallow?](#how-to-make-a-shallow-repository-unshallow)
- [Does it support wire protocol version 2?](#does-it-support-wire-protocol-version-2)

## Is this based on `js-git`?

_Answer by Will Hilton (@wmhilton):_

No, it is a rewrite from scratch. I basically wrote this library because I though js-git was a great idea but poorly designed for actual use.
This quote from the Q-Git documentation illustrates it best:

> JS-Git requires a certain amount of ceremony oweing to its many layers of configurability and code reuse.
> ```js
> var repo = {};
> repo.rootPath = fs.join(__dirname, "..", ".git");
> require("git-node-fs/mixins/fs-db")(repo, repo.rootPath);
> require('js-git/mixins/create-tree')(repo);
> require('js-git/mixins/pack-ops')(repo);
> require('js-git/mixins/walkers')(repo);
> require('js-git/mixins/read-combiner')(repo);
> require('js-git/mixins/formats')(repo);
> ```

That is six different modules being required *just to open a repo*.
Implementation details, like `read-combiner` and `pack-ops` are exposed.
It is so hyper-modular that the ability to open a repo in a file system is not part of the core of `js-git` but requires you to install a second package called `git-node-fs`.

While `js-git` is extremely clever, it suffers from being too ahead of its time.
It was written in 2013, before async/await and even before Node streams were very good (I believe streams2 came out right about the time js-git started) and so the codebase uses something called 'continuables' and its own stream implementation called 'min-streams'.
So right off the bat, in order to begin using the code, you have to learn two new alien/outdated concepts.
And obviously this was written in ES5 because ES6 (aka ES2015) had not come out yet.
In the years since, js-git has not changed to keep up with the JavaScript language to take advantage of things like async/await, Promises, and streams.
There was enough interest in it though that [multiple projects](https://github.com/creationix/js-git/issues/132) were spawned to create successors to js-git.
Isomorphic-git just happens to be the most mature successor.

## How does this compare with `nodegit`?

> How is isomorphic git different from nodegit?
> I understand that nodegit is just a nodeJS binding for libgit, but apart from the implementation, how are these two different, and how do I choose between which to use?
> Excluding the isomorphism

_Answer by Dan Allen (@mojavelinux) in the Gitter channel, reposted with permission:_

As a current user of nodegit who is planning to migrate to isogit, I can offer some insight into this question.
First and foremost, isogit is pure JavaScript. this is no small thing. the single biggest obstacle to using the tool I built on nodegit (named Antora) is getting nodegit installed.
Nodegit is highly system dependent and really only works without modification on Windows (since binaries are made available) and Ubuntu after installing some packages.
All other versions of Linux require that you recompile libgit2 from scratch, which takes forever.
So do not ignore how much of a pain it will be for users or even developers if you choose nodegit.
Aside from that, nodegit can only operate on a full clone. isogit already offers many more efficient paths to getting information out of the repository because it only takes what it needs.
Authentication in nodegit is also quite a disaster, imho.
Basically, it's very system dependent and authentication errors can result in segfaults due to overzealous assertions in the libgit2 C code.
Don't get me wrong, nodegit is very powerful. it offers a pretty complete git experience thanks to the fact that it uses libgit2 under the covers.
But it has a lot of warts, from installation to incomplete mapping...and I think the most viable strategy for a Node project is to be using something that is pure JavaScript...hence my personal interest and recommendation for isogit.
I'm counting the days until Antora can offer isogit as the primary git client. (i just haven't gotten around to integrating it yet).
What I like most about nodegit is probably the tree walker...that's a nice way to extract content out of a git branch.
But there's really nothing nodegit can do that isogit can't or won't be able to do...and I think isogit is in a position to be a lot more flexible since it's not coupled to another library (as nodegit is to libgit2).
I also find the isogit project to be much more friendly. @wmhilton is a great development lead.

## How does this compare with...

Here's a collection of all the other JavaScript git libraries I can find.
I haven't had time to review them all.

- https://github.com/mariusGundersen/es-git
- https://github.com/SamyPesse/gitkit-js
- https://github.com/MatrixAI/js-virtualgit
- http://gitlet.maryrosecook.com/docs/gitlet.html <-- one of my favorites!

## Why is there no `default` export in the ES module?

> I've noticed that ES6 import of the the module requires import * as git from 'isomorphic-git'.
> It seems that there's no default export which should just contain all the functions
> I'm suggesting to have a default export that gathers all the functions together.

In 0.x.x I withheld adding a `default` export for the reasons explained below. However in 1.x.x there _is_ a default export - with a caveat!
The CommonJS format does _not_ have a default export. This actually makes the most sense because it means this Just Works (TM):

```js
const git = require('isomorphic-git')
```

If you have a default export _and_ a named export, Rollup spits out a file that has to be consumed like this...

```js
const git = require('isomorphic-git').default
```

which nobody wants.

To benefit from tree-shaking, you still should use named exports. But for convenience there is a default export now! So either of these work:

```js
import git from 'isomorphic-git'
// or
import * as git from 'isomorphic-git'
```

which strays from my usual Pythonic "there should only be one way to do it, and that way should be the best way" attitude... but having a default export also makes using the library _simpler_ because you don't have to think about whether to use a namespace import or a default import. And it looks nicer.

Old Answer preserved for posterity:

_Answer by Will Hilton (@wmhilton):_

Default exports are actually really bad for tree-shaking. If you do `import * as git from 'isomorphic-git'` and only use `git.log`, rollup and webpack are smart enough to only bundle `git.log`.
But if you do `import git from 'isomorphic-git'` then they can't do any tree-shaking, because you're importing an Object that could have interdependent functions and side effects.
Plus, if you export a default then the commonjs usage gets weird, because then you have to do `const git = require('git').default`
So I've concluded that `default` exports are simply a bad pattern, and I don't think anyone should ever use them.

I'll reconsider the matter once Node.js figures out how it is dealing with mixed ES6 imports and CJS requires.
But for now I think having a `default` export causes more harm than good - since the only good it does is save typing "`* as `" as far as I can tell.
But that is a VERY good question and one I spent a long time trying to figure out when I was researching how to design the module, and I remember being very disappointed at first when I discovered that `default` exports destroy tree-shaking.

## How to add all untracked files with git.add? 

> I'm looking for a way init a git repo, add all existing files, and commit them, while if I understand correctly, the git.add function needs me to give all of the files explicitly.
> 
> Is there a way that I can add all of the files in one or two command?

_Answer by Will Hilton (@wmhilton):_

TLDR:
```js
const globby = require('globby');
const paths = await globby(['./**', './**/.*'], { gitignore: true });
for (const filepath of paths) {
    await git.add({ fs, dir, filepath });
}
```

Long answer including a browser solution by @jcubic: [#187](https://github.com/isomorphic-git/isomorphic-git/issues/187)

## How to make a shallow repository unshallow?

> Is there an equivalent to `git fetch --unshallow`?

The fast and dirty solution is just use really big depth, like `{depth: 1000000000}`.

What I would actually recommend would be the following:
- Start with `{ singleBranch: true, depth: 1 }`
- Then fetch with `{ depth: 100, relative: true }` which will grab the previous 100 commits
- Then repeat fetching with `{ depth: 100, relative: true }` as needed until you have the full history. 

This gives you a well-behaved, paginated method for lengthening the git history as needed!

You can tell you have the full history indirectly by a couple of means... probably the easiest would just be `git.log` and when the array returned stops growing in length.
A slightly more efficient way of telling if you have the full history, would be to grab the oid from the last commit returned by `git.log` and use that as the starting point for the next call to `git.log` with `{ ref: oid }` and keep repeating until git.log only returns one commit. Or you could use the `'progress' event emitter` in `fetch` and if the fetch completed successfully with 0 progress events, I think that would indicate there's no more to fetch. 

## Does it support wire protocol version 2?

Not yet, but you can go [upvote the issue](https://github.com/isomorphic-git/isomorphic-git/issues/585)
As soon as GitHub supports the [fetch filter feature](https://git-scm.com/docs/protocol-v2#_fetch) I'll have a reason to work on it, because that would be extremely useful in browser environments!
But until then, there's no advantage to using the new protocol.
