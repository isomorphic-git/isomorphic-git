---
id: browser-file-system-access
title: Using the File System Access API
sidebar_label: File System Access API
---

Some browser apps keep a repository on the user's own disk through the
[File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API),
for example with `showDirectoryPicker()` and an `fs` adapter built on top of it.
Chrome refuses to create or write some paths inside `.git`.
This page lists those paths, the isomorphic-git commands that write them, and how to avoid them.

## Why writes fail

Chrome keeps a blocklist of sensitive paths.
Since Chrome 156 (stable since 2026-10-20), the feature `FileSystemAccessWriteBlocklistCheck` is on by default.
With it, Chrome checks the blocklist each time a page creates a folder or a file
(`getDirectoryHandle(name, { create: true })`, `getFileHandle(name, { create: true })`)
or opens a file for writing (`createWritable()`).
A blocked path rejects with a `DOMException` named `SecurityError`.
Your `fs` adapter may pass that error on as it is, or wrap it.

Reads are not blocked. An app can still read every file of a repository, including one that git made.

| Blocked path | Status | Chromium issues |
| --- | --- | --- |
| `.git/hooks` | Blocked since Chrome 156 | [465668234](https://crbug.com/465668234), [553115714](https://crbug.com/553115714) |
| `.git/config` | On Chromium main and the 156, 157 and 158 branches, not in a released build yet | [572269631](https://crbug.com/572269631) |
| `.git/modules` | On Chromium main and the 156, 157 and 158 branches, not in a released build yet | [571913154](https://crbug.com/571913154) |

A rule matches its path anywhere in a longer path, ignores case, and also blocks everything inside it.
For example, `/projects/app/.git/hooks` and `/projects/app/.GIT/Hooks/pre-commit` are both blocked.
The rules only match a folder named `.git`, so a bare repository or a `gitdir` with another name is not affected.

## Commands that write a blocked path

| Command | What it writes | How to avoid it |
| --- | --- | --- |
| `init` | creates the `.git/hooks` folder | `noHooks: true` |
| `init` | writes `.git/config` | `noConfig: true` |
| `clone` | creates the `.git/hooks` folder | `noHooks: true` |
| `clone` | writes `.git/config`: the remote, `http.corsProxy` and the branch tracking | `noConfig: true` |
| `checkout` | writes `.git/config` when it makes a local branch from a remote branch with `track: true` (the default) | `track: false` |
| `addRemote` | writes `.git/config` | don't call it, pass `url` instead |
| `setConfig` | writes `.git/config` | don't call it |
| `deleteRemote` | writes `.git/config` when the remote is in it | nothing, if the repository has no config |
| `deleteBranch` | writes `.git/config` when it has a section for that branch | nothing, if the repository has no config |

Every other command only reads `.git/config`. A missing config file reads as an empty one.
No command writes `.git/modules`, see [A repository with submodules](#a-repository-with-submodules).

## What to do

```js
// Make the repository without .git/hooks and .git/config
await git.init({ fs, dir, noHooks: true, noConfig: true })
await git.clone({ fs, http, dir, url, corsProxy, noHooks: true, noConfig: true })

// Nothing is saved in a config, so pass url and corsProxy every time
await git.fetch({ fs, http, dir, url, corsProxy })
await git.pull({ fs, http, dir, url, corsProxy, author })
await git.push({ fs, http, dir, url, corsProxy })

// Make a local branch from a remote branch without saving the tracking
await git.checkout({ fs, dir, ref: 'feature', track: false })
```

- Pass `noHooks: true` and `noConfig: true` to `init` and `clone`.
- Pass `url` (and `corsProxy`) to `fetch`, `pull` and `push`.
  When the remote isn't in the config, `fetch` and `pull` still save its branches under `refs/remotes/<remote>/`, like after a normal clone.
- Without branch tracking, `pull` and `push` use the remote branch with the same name as the local one. Pass `remoteRef` to pick another one.
- Pass `track: false` to `checkout`.
- `user.name` and `user.email` can't be saved, so pass `author` (and `committer`) to `commit`, `merge`, `pull` and the other commands that make commits, and `tagger` to `annotatedTag`.
  `stash` (push and create) has no `author` option and takes the name and email only from the config, so it fails with `MissingNameError` in a repository without one.
- Don't call `addRemote` or `setConfig`.
  If you have to, for example in a repository that git made, catch the `SecurityError`.

## A repository without a config

- git treats `.git/config` as optional.
  A `.git` folder with `HEAD`, `objects` and `refs` is a valid repository, and the git command line works in it.
- git uses its own defaults for the settings `init` normally writes, such as `core.filemode`, `core.symlinks` and `core.ignorecase`.
- The git command line only sees what the app wrote.
  It finds no remotes and no branch tracking, so in a terminal `git fetch` needs a url, or `git remote add origin <url>` first.
  The remote branches under `refs/remotes/origin/` are there, so `git log origin/main` works.
- If the repository already has a `.git/config` (for example one that git made), isomorphic-git reads it as usual.
  Writing to it fails once Chrome blocks `.git/config`.

## A repository without hooks

isomorphic-git never runs hook scripts (it has callbacks such as `onPrePush` and `onPostCheckout` instead),
so a repository without a `hooks` folder works the same.
The git command line works in it too.

## A repository with submodules

git keeps the git folder of each submodule in `.git/modules/<name>` of the parent repository.
isomorphic-git can't add, clone or update submodules, so it never creates or writes `.git/modules` by itself.

isomorphic-git can still run commands inside a submodule that git made.
There the git folder is `<parent>/.git/modules/<name>`, so once Chrome blocks `.git/modules`,
every command that writes (`commit`, `checkout`, `fetch` and so on) fails inside a submodule.
Reading a submodule keeps working.
