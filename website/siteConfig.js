/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* List of projects/orgs using your project for the users page */
const users = require('./users')

const siteConfig = {
  title: 'isomorphic-git' /* title for your website */,
  tagline: 'A pure JavaScript implementation of git for node and browsers!',
  url: 'https://isomorphic-git.org' /* your website url */,
  cname: 'isomorphic-git.org' /* gets overwritten each time */,
  baseUrl: '/' /* base url for your project */,
  editUrl: 'https://github.com/isomorphic-git/isomorphic-git.github.io/edit/source/docs/',
  headerLinks: [
    {
      doc: 'alphabetic',
      label: 'API Docs'
    },
    { doc: 'quickstart', label: 'Guide' },
    { blog: true, label: 'Blog' },
    {
      href: 'https://github.com/isomorphic-git/isomorphic-git',
      label: 'GitHub'
    },
    {
      href: 'https://npmjs.com/package/isomorphic-git',
      label: 'npm'
    }
  ],
  users,
  /* path to images for header/footer */
  headerIcon: 'img/isomorphic-git-logo.svg',
  footerIcon: 'img/isomorphic-git-logo.svg',
  twitterImage: 'img/favicon/android-chrome-192x192.png',
  favicon: 'img/favicon.png',
  /* colors for website */
  colors: {
    primaryColor: '#2E8555',
    secondaryColor: '#205C3B'
  },
  // This copyright info is used in /core/Footer.js and blog rss/atom feeds.
  copyright: 'Copyright © ' +
    new Date().getFullYear() +
    ' Isomorphic-git Contributors',
  organizationName: 'isomorphic-git', // or set an env variable ORGANIZATION_NAME
  projectName: 'isomorphic-git.github.io', // or set an env variable PROJECT_NAME
  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks
    theme: 'default'
  },
  scripts: [
    '/js/announcement.js',
  ],
  footerscripts: [
    'https://platform.twitter.com/widgets.js',
    '/js/gitter.js',
    '/js/sidecar.v1.js',
    'https://unpkg.com/@isomorphic-git/lightning-fs',
    'https://unpkg.com/isomorphic-git',
    'https://unpkg.com/openpgp@2.6.2/dist/openpgp.min.js',
    '/js/fs.js',
    'https://unpkg.com/@webcomponents/shadydom',
    '/js/object-inspector.min.js',
    '/js/tutorial.js',
    '/js/try-it-out-giturl.js',
    '//static.getclicky.com/js',
    '/js/analytics.js',
  ],
  // stylesheets: ['./css/tutorial.css'],
  // You may provide arbitrary config keys to be used as needed by your template.
  repoUrl: 'https://github.com/isomorphic-git/isomorphic-git',
  algolia: {
    apiKey: 'ac63b0df4513e31143eef156f520056c',
    indexName: 'isomorphic_git',
    algoliaOptions: {
      typoTolerance: 'min'
    }
  },
  cleanUrl: true,
}

module.exports = siteConfig
