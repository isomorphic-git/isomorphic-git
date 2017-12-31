# Interactive Tutorial

BrowserFS and isomorphic-git have already been loaded into this page! Open the JavaScript console and try typing the following commands.

First, explore some of the global variables. (Don't make them global in your own code. They are just global here for this tutorial's convenience.)

```js
fs
```

```js
git
```

```js
dir
```

Let's examine the filesystem! We can do that with the [`readdir`](https://nodejs.org/api/fs.html#fs_fs_readdir_path_options_callback) method.

```js
fs.readdir('/', console.log)
```

That's not very exciting. Let's spice things up by initializing a git repository. `git.init` will take care of creating any missing directories for us.

```js
await git.init({fs, dir})
fs.readdir('/', console.log)
```

Well that's something!

```js
fs.readdir('/tutorial', console.log)

fs.readdir('/tutorial/.git', console.log)
```

Alright! We've got a git repository, or at least the boilerplate. Let's add a file and make a commit.
(Sorry for mixing callbacks with async/await. In your own code, you might want to wrap the raw "fs" module with a promisified version.)

```js
fs.writeFile(`${dir}/hello.txt`, 'Hello World!', {encoding: 'utf8'}, async () => {
  await git.add({fs, dir, filepath: 'hello.txt'})
  await git.commit({fs, dir, message: 'Initial commit'})
  console.log(await git.log({fs, dir}))
})
```
