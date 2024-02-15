---
title: The `cache` parameter
sidebar_label: cache
id: version-1.x-cache
original_id: cache
---

TL;DR see [Example](#example).

## Background

Some git commands can greatly benefit from a cache.
Reading and parsing git packfiles (the files sent over the wire during `clone`, `fetch`, `pull` and `push`) can take a "long" time for large git repositories.
(Here "long" is usually measured in milliseconds.)

For example, here is one of the absolute worst performing things you can do:

```js
// PLEASE DON'T DO THIS!! This is for demonstration purposes only.
const test = async () => {
  console.time('time elapsed')
  for (const filepath of await git.listFiles({ fs, dir })) {
    console.log(`${filepath}: ${await git.status({ fs, dir, filepath })}`)
  }
  console.timeEnd('time elapsed')
}

test().catch(err => console.log(err))
```

Running this code on the `isomorphic-git` repo on my 2018 Macbook Pro takes over 2 minutes!

It is slow because every time you call `git.status` it has to re-read and re-parse one or more packfiles in `.git/objects/pack`.
Each individual status may take relatively little time (10ms to 100ms) but if you have thousands of files that quickly adds up.

Naively doing it in parallel will not help!

```js
// PLEASE DON'T DO THIS!! This is for demonstration purposes only.
const test = async () => {
  console.time(`time elapsed`)
  const filepaths = await git.listFiles({ fs, dir })
  await Promise.all(
    filepaths.map(async filepath => {
      console.log(`${filepath}: ${await git.status({ fs, dir, filepath })}`)
    })
  )
  console.timeEnd(`time elapsed`)
}

test().catch(err => console.log(err))
```

This performs even worse than the first code snippet because now instead of reading and parsing the packfiles thousands of times in a row, you are doing the same workload in parallel!
It quickly consumed all 32 GB of memory on my Macbook and I had to kill it after 4 minutes.

You can write an extremely performant version of the above though using [`walk`](./walk.html).
That's what [`statusMatrix`](./statusMatrix.html) is.

```js
const test = async () => {
  console.time(`time elapsed`)
  const matrix = await git.statusMatrix({ fs, dir })
  for (const [filepath, head, workdir, stage] of matrix) {
    console.log(`${filepath}: ${head} ${workdir} ${stage}`)
  }
  console.timeEnd(`time elapsed`)
}

test().catch(err => console.log(err))
```

This runs in 843ms on my machine.

## The `cache` parameter

As you can see, you can easily write yourself into a performance trap using `isomorphic-git` commands in isolation.

Unlike canonical `git` commands however, there is a way for `isomorphic-git` commands to cache intermediate results
and reuse them between commands.
It used to do this by default, but that results in a memory leak if you never clear the cache.

There is no single best caching strategy:
- For long-running processes, you may want to monitor memory usage and discard the cache when memory usage is above some threshold.
- For memory constrained devices, you may want to not use a cache at all.

Instead of compromising, I've placed a powerful tool in your hands:
1. You pass in an ordinary `cache` object.
2. isomorphic-git stores data on it by setting Symbol properties.
3. Manipulating the `cache` directly will void your warranty ⚠️.
4. To clear the cache, remove any references to it so it is garbage collected.

## Example

Here's what the first example looks like re-written to use a shared `cache` parameter:

```js
// PLEASE DON'T DO THIS!! This is for demonstration purposes only.
const test = async () => {
  console.time('time elapsed')
  let cache = {}
  for (const filepath of await git.listFiles({ fs, dir, cache })) {
    console.log(`${filepath}: ${await git.status({ fs, dir, filepath, cache })}`)
  }
  console.timeEnd('time elapsed')
}

test().catch(err => console.log(err))
```

This code runs in under 8 seconds on my machine.
(Compare with over 2 minutes without the `cache` argument.)
Still nowhere as good as `statusMatrix`, but not everything you might want to do with isomorphic-git can be described by a [`walk`](./walk.html).

The catch of course, is you have to decide when (if ever) to get rid of that cache.
It is just a JavaScript object, so all you need to do is eliminate any references to it and it will be garbage collected.

```js
// 1. Create a cache
let cache = {}
// 2. Do some stuff
// 3. Replace cache with new object so old cache is garbage collected
cache = {}
```
