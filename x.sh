npm ci

npm install --save-dev karma@latest
git add -A
git commit -m 'chore(deps-karma dev): bump karma from 2.0.5 to 6.3.18'

npm install --save-dev karma-browserstack-launcher@latest
git add -A
git commit -m 'chore(deps-dev): bump karma-browserstack-launcher from 1.5.1 to 1.6.0'

npm install --save-dev karma-chrome-launcher@latest
git add -A
git commit -m 'chore(deps-dev): bump karma-chrome-launcher from 3.1.0 to 3.1.1'

npm install --save-dev karma-firefox-launcher@latest
git add -A
git commit -m 'chore(deps-dev): bump karma-firefox-launcher from 1.2.0 to 2.1.2'

npm install --save-dev karma-jasmine@latest
git add -A
git commit -m 'chore(deps-dev): karma-jasmine bump from 2.0.1 to 5.0.0'

npm install --save-dev karma-junit-reporter@latest
git add -A
git commit -m 'chore(deps-dev): bump karma-junit-reporter from 1.2.0 to 2.0.1'


npm install --save-dev jasmine-core@^3.99.1
git add -A
git commit -m 'chore(deps-dev): bump jasmine-core from 3.4.0 to 3.99.1'

[ -f ./node_modules/isomorphic-git/dist/browser-tests.json ] && rm ./node_modules/isomorphic-git/dist/browser-tests.json
npm test