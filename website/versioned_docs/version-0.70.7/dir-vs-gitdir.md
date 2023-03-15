---
title: `dir` vs `gitdir`
sidebar_label: dir vs gitdir
id: version-0.70.7-dir-vs-gitdir
original_id: dir-vs-gitdir
---

I looked hard and wide for a good explanation of the "working tree" and the "git directory" and the best I found was this one:

> If you have a non-bare git repository, there are two parts to it: the *git directory* and the *working tree*:
>
> - The *working tree* has your checked out source code, with any changes you might have made.
> - The *git directory* is normally named `.git`, and is in the top level of your working tree - this contains all the history of your project, configuration settings, pointers to branches, the index (staging area) and so on.
> 
> While this is the default layout of a git repository, you can actually set any directories in the filesystem to be your git directory and working tree. You can change these directories from their defaults either with the --work-tree and --git-dir options to git or by using the GIT_DIR and GIT_WORK_TREE environment variables. Usually, however, you shouldn't need to set these.
>
> — [Mark Longair from Stack Overflow](https://stackoverflow.com/a/5283457)

The isomorphic-git equivalent of `--work-tree` is the **`dir`** argument.

The isomorphic-git equivalent of `--git-dir` is the **`gitdir`** argument.

This is really only important when working with bare repositories. Most of the time setting `dir` is sufficient, because `gitdir` defaults to `path.join(dir, '.git')`.
