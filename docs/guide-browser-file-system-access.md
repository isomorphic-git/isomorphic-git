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

A rule matches its path anywhere in a longer path, ignores case, and also blocks everything inside it.
For example, `/projects/app/.git/hooks` and `/projects/app/.GIT/Hooks/pre-commit` are both blocked.
The rules only match a folder named `.git`, so a bare repository or a `gitdir` with another name is not affected.

## Commands that write a blocked path

| Command | What it writes | How to avoid it |
| --- | --- | --- |
| `init` | creates the `.git/hooks` folder | `noHooks: true` |
| `clone` | creates the `.git/hooks` folder | `noHooks: true` |

## What to do

Pass `noHooks: true` to `init` and `clone`:

```js
await git.init({ fs, dir, noHooks: true })
await git.clone({ fs, http, dir, url, noHooks: true })
```

isomorphic-git never runs hook scripts (it has callbacks such as `onPrePush` and `onPostCheckout` instead),
so a repository without a `hooks` folder works the same.
The git command line works in it too.
