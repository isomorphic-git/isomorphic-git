## Legacy stuff that keeps isomorphic-git compatible

## Install 
This is WiP Work in Progress 
```js
npm install isomorphic-git@awesome/isomorphic-git
// build all legacy bundles in your local project inside the defined dir
npx rollup -c node_modules/isomorphic-git-repo/rollup.config -dir ./isomorphic-git
```


```js
npm install universal-git
// build all legacy bundles in your local project inside the defined dir
npx rollup -c node_modules/universal-git/rollup.config
```

We do not need most of the files of the repos

v2.37.1+
```
git clone --filter=blob:none --no-checkout --depth 1 --sparse <project-url>
cd <project>
git sparse-checkout set apps/my_app libs/my_lib # overrides all existing
git sparse-checkout add <folder1> <folder2> # adds
git checkout # or switch
```

git 2.25+
```
# create a shallow clone, with only latest commit in history
git clone <URL> --no-checkout <directory> --depth 1 <project-url>
git sparse-checkout init --cone # to fetch only root files
# etc, to list sub-folders to checkout
git sparse-checkout set apps/my_app libs/my_lib
git checkout # or switch
```

changes pre 2.25
```
git init
git config core.sparseCheckout true
git remote add -f origin git://...
echo "path/within_repo/to/desired_subdir/*" > .git/info/sparse-checkout
git checkout [branchname] # ex: master
```
