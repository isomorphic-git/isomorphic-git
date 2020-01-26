---
id: browser
title: Browser Quick Start
sidebar_label: Browser Quick Start
---

<br>
<aside>
If you've already done the tutorial or need a clean slate, you can run this snippet to clean up the file system.

```js live
window.fs = new LightningFS('fs', { wipe: true })
git.plugins.set('fs', window.fs)
window.pfs = window.fs.promises
```
</aside>

Here's a whirlwind tour of the main features of `isomorphic-git`.

First, let's set up LightningFS and isomorphic-git. *Note: I've already done this for you, which is why there is no RUN button for this code block.*

```html
<script src="https://unpkg.com/@isomorphic-git/lightning-fs"></script>
<script src="https://unpkg.com/isomorphic-git"></script>
<script>
// Initialize isomorphic-git with a file system
window.fs = new LightningFS('fs')
git.plugins.set('fs', window.fs)
// I prefer using the Promisified version honestly
window.pfs = window.fs.promises
</script>
```

Now let's pick a directory to work in.

```js live
window.dir = $input(('/tutorial'))
console.log(dir);
await pfs.mkdir(dir);
// Behold - it is empty!
await pfs.readdir(dir);
```

Now that we've got an empty directory, let's clone a git repository.
I'm cloning `isomorphic-git` itself (how meta!).
I'm only cloning a single branch and only to a depth of 10 commits to save time, bandwidth, and browser storage space.
Since GitHub hasn't added CORS headers to the git clone endpoint yet, we have to use a [proxy server](https://cors.isomorphic-git.org/).
(They never suspected that a *browser* would want to run "git clone"!)

```js live
await git.clone({
  dir,
  corsProxy: 'https://cors.isomorphic-git.org',
  url: 'https://github.com/isomorphic-git/isomorphic-git',
  ref: 'master',
  singleBranch: true,
  depth: 10
});

// Now it should not be empty...
await pfs.readdir(dir);
```

Great! We've got files. We've also got commits.
Let's see what the recent history of this branch looks like.
*Hint: be sure to expand the objects so you can see all the properties.*

```js live
await git.log({dir})
```

Git is used to track files. Let's see what kind of file things we can do!

git.status is a major one. That let's us compare the working directory file to the current branch.

```js live
await git.status({dir, filepath: '$input((README.md))'})
```

OK so the status is "unmodified" because we haven't modified it.
What if we change the file by writing over it?

```js live
await pfs.writeFile(`${dir}/README.md`, 'Very short README', 'utf8')
await git.status({dir, filepath: 'README.md'})
```

The status is "\*modified" with a star.
Text editors sometimes use a "\*" in the title bar to indicate a file has unsaved changes.
That's what is going on here - we've made changes to the file but we haven't added those changes to the git "staging area".

```js live
await git.add({dir, filepath: 'README.md'})
await git.status({dir, filepath: 'README.md'})
```

Now that we've done "git add" that little star has gone away and the status is just "modified".

What if we write a new file?

```js live
await pfs.writeFile(`${dir}/newfile.txt`, 'Hello World', 'utf8')
await git.status({dir, filepath: 'newfile.txt'})
```

"\*added" means the file has been added, but not staged. Simple to fix:

```js live
await git.add({dir, filepath: 'newfile.txt'})
await git.status({dir, filepath: 'newfile.txt'})
```

The third and final trick: deleting a file:

```js live
await pfs.unlink(`${dir}/package.json`)
await git.status({dir, filepath: 'package.json'})
```

This last bit has always been unintuitive to me... but you need to tell git you deleted the file.
```js live
await git.remove({dir, filepath: 'package.json'})
await git.status({dir, filepath: 'package.json'})
```

What happens if you tell git you deleted a file but you really didn't?

```js live
await git.remove({dir, filepath: 'package-lock.json'})
await git.status({dir, filepath: 'package-lock.json'})
```

Does that make sense? No? Sorry, naming things is hard. (Git doesn't do a great job of it either.
It reports the file as "untracked" and "deleted" at the same time.) OK, enough messing around.

```js live
await git.add({dir, filepath: 'package-lock.json'})
await git.status({dir, filepath: 'package-lock.json'})
```

Cool. So we've deleted package.json and replaced the README with the text "Very short README".
A solid day's work - let's commit those changes.

```js live
let sha = await git.commit({
  dir,
  message: 'Delete package.json and overwrite README.',
  author: {
    name: 'Mr. Test',
    email: 'mrtest@example.com'
  }
})

sha
```

git.commit returns the shasum of our new commit. Let's examine our handiwork:

```js live
commits = await git.log({dir, depth: 1})
commits[0]
```
