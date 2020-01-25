/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react')
const GoHistory = require('react-icons/lib/go/history')
const GoKey = require('react-icons/lib/go/key')
const GoLock = require('react-icons/lib/go/lock')
const GoSettings = require('react-icons/lib/go/settings')
const GoFileBinary = require('react-icons/lib/go/file-binary')
const GoDiffModified = require('react-icons/lib/go/diff-modified')
const GoGitBranch = require('react-icons/lib/go/git-branch')
const GoGitCommit = require('react-icons/lib/go/git-commit')
const GoRepo = require('react-icons/lib/go/repo')
const GoRepoClone = require('react-icons/lib/go/repo-clone')
const GoRepoPush = require('react-icons/lib/go/repo-push')
const GoRepoPull = require('react-icons/lib/go/repo-pull')

const CompLibrary = require('../../core/CompLibrary.js')
const MarkdownBlock = CompLibrary.MarkdownBlock /* Used to read markdown */
const Container = CompLibrary.Container
const GridBlock = CompLibrary.GridBlock

const siteConfig = require(process.cwd() + '/siteConfig.js')

function imgUrl (img) {
  return siteConfig.baseUrl + 'img/' + img
}

function docUrl (doc, language) {
  return siteConfig.baseUrl + 'docs/' + (language ? language + '/' : '') + doc
}

function pageUrl (page, language) {
  return siteConfig.baseUrl + (language ? language + '/' : '') + page
}

class Button extends React.Component {
  render () {
    return (
      <div className='pluginWrapper buttonWrapper'>
        <a className='button' href={this.props.href} target={this.props.target}>
          {this.props.children}
        </a>
      </div>
    )
  }
}

Button.defaultProps = {
  target: '_self'
}

const SplashContainer = props => (
  <div className='homeContainer'>
    <div className='homeSplashFade'>
      <div className='wrapper homeWrapper'>{props.children}</div>
    </div>
  </div>
)

const Logo = props => (
  <div className='projectLogo'>
    <img src={props.img_src} />
  </div>
)

const ProjectTitle = props => (
  <h2 className='projectTitle'>
    {siteConfig.title}
    <small>{siteConfig.tagline}</small>
  </h2>
)

const PromoSection = props => (
  <div className='section promoSection'>
    <div className='promoRow'>
      <div className='pluginRowBlock'>{props.children}</div>
    </div>
  </div>
)

class HomeSplash extends React.Component {
  render () {
    let language = this.props.language || ''
    return (
      <SplashContainer>
        <Logo img_src={imgUrl('isomorphic-git-logo.svg')} />
        <div className='inner'>
          <ProjectTitle />
          <PromoSection>
            <Button href={docUrl('browser.html', language)}>
              Getting Started
            </Button>
            <Button href={docUrl('init.html', language)}>
              Interactive Docs
            </Button>
            <Button href='https://github.com/isomorphic-git/isomorphic-git/releases'>Download</Button>
          </PromoSection>
        </div>
      </SplashContainer>
    )
  }
}

const Block = props => (
  <Container
    padding={['bottom', 'top']}
    id={props.id}
    background={props.background}
  >
    <GridBlock align='center' contents={props.children} layout={props.layout} />
  </Container>
)

const Features = props => (
  <Block layout='fourColumn'>
    {[
      {
        content: 'Clone repos, create commits, push branches and more in client-side JS.',
        image: 'https://badges.herokuapp.com/browsers?googlechrome=+66&firefox=60&microsoftedge=17&safari=11&android=7.1&iphone=11.2',
        imageAlign: 'top',
        title: 'Works in All Modern Browsers'
      },
      {
        content: 'It uses the same on-disk format as `git` so it works with existing repos.',
        image: imgUrl('nodejs-new-pantone-black.png'),
        imageAlign: 'top',
        title: 'Works on Desktops and Servers'
      }
    ]}
  </Block>
)

const FeatureCallout = props => (
  <div
    className='productShowcaseSection paddingBottom'
    style={{ textAlign: 'center' }}
  >
    <h2>Features</h2>
    <ul className="isomorphic-git-feature-list">
      <li><GoRepoClone size='3em'/> clone repos</li>
      <li><GoRepo size='3em'/> init new repos</li>
      <li><GoGitBranch size='3em'/> list branches and tags</li>
      <li><GoHistory size='3em'/> list commit history</li>
      <li><GoRepoPull size='3em'/>checkout branches</li>
      <li><GoRepoPush size='3em'/> push branches to remotes<a title="via a proxy server">*</a></li>
      <li><GoGitCommit size='3em'/> create new commits</li>
      <li><GoSettings size='3em'/> read & write to .git/config</li>
      <li><GoFileBinary size='3em'/> read & write raw git objects</li>
      <li><GoLock size='3em'/> sign commits</li>
      <li><GoKey size='3em'/> verify signed commits</li>
      <li><GoDiffModified size='3em'/> working file status</li>
    </ul>
  </div>
)

const TryGitRemoteInfo = props => (
  <div className="try-it-out">
    <h2>Try it out</h2>
    <label htmlFor="giturl">Enter a git URL:</label>
    <div>
      <input id="giturl_input" name="giturl" type="text" className="input" defaultValue="https://github.com/facebook/react" size="50" style={{ maxWidth: '80%' }}/>
      <button id="giturl_button" type="button" className="button" value="Fetch Info">Fetch Info</button>
      <div><b>Branches:</b> <span id="giturl_branches"></span></div>
      <div><b>Tags:</b> <span id="giturl_tags"></span></div>
    </div>
  </div>
)

const LearnHow = props => (
  <Container
    padding={['bottom', 'top']}
    id={props.id}
    background='light'
  >
    <div style={{ float: 'right', width: '40%', marginLeft: '60px' }}>
      <TryGitRemoteInfo/>
    </div>
    <div style={{ textAlign: 'justify' }}>
      <MarkdownBlock>{`
  isomorphic-git is a pure JavaScript implementation of git that works in node and browser environments (including WebWorkers and ServiceWorkers).
  This means it can be used to read and write to git repositories, as well as fetch from and push to git remotes like GitHub.

  isomorphic-git aims for 100% interoperability with the canonical git implementation.
  This means it does all its operations by modifying files in a ".git" directory just like the git you are used to.
  The included \`isogit\` CLI can operate on git repositories on your desktop or server.

  isomorphic-git aims to be a complete solution with no assembly required.
  The API has been designed with modern tools like Rollup and Webpack in mind.
  By providing functionality as individual functions, code bundlers can produce smaller bundles by including only the functions your application uses.
      `}</MarkdownBlock>
    </div>
  </Container>
)

const Praise = props => {
  return (
    <div
      className='productShowcaseSection paddingBottom'
      style={{ maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}
    >
      <a className="twitter-moment" href="https://twitter.com/i/moments/1073726885362888706?ref_src=twsrc%5Etfw">Praise for Isomorphic-Git</a>
    </div>
  )
}

const Showcase = props => {
  if ((siteConfig.users || []).length === 0) {
    return null
  }
  const showcase = siteConfig.users
    .filter(user => {
      return user.pinned
    })
    .map((user, i) => {
      return (
        <a href={user.infoLink} key={i}>
          <img src={user.image} title={user.caption} />
        </a>
      )
    })

  return (
    <div className='productShowcaseSection paddingBottom'>
      <h2>{"Who's Using This?"}</h2>
      <p>This project is used by:</p>
      <div className='logos'>{showcase}</div>
      <div className='more-users'>
        <a className='button' href={pageUrl('users.html', props.language)}>
          More {siteConfig.title} Users
        </a>
      </div>
    </div>
  )
}

class Index extends React.Component {
  render () {
    let language = this.props.language || ''

    return (
      <div>
        <HomeSplash language={language} />
        <div className='mainContainer'>
          <Features />
          <FeatureCallout />
          <LearnHow />
          <Praise />
          <Showcase language={language} />
        </div>
      </div>
    )
  }
}

module.exports = Index
