/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require("react");
const GoHistory = require("react-icons/lib/go/history");
const GoKey = require("react-icons/lib/go/key");
const GoLock = require("react-icons/lib/go/lock");
const GoSettings = require("react-icons/lib/go/settings");
const GoFileBinary = require("react-icons/lib/go/file-binary");
const GoDiffModified = require("react-icons/lib/go/diff-modified");
const GoGitBranch = require("react-icons/lib/go/git-branch");
const GoGitMerge = require("react-icons/lib/go/git-merge");
const GoGitCommit = require("react-icons/lib/go/git-commit");
const GoRepo = require("react-icons/lib/go/repo");
const GoRepoClone = require("react-icons/lib/go/repo-clone");
const GoRepoPush = require("react-icons/lib/go/repo-push");
const GoRepoPull = require("react-icons/lib/go/repo-pull");

const CompLibrary = require("../../core/CompLibrary.js");
const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;

const siteConfig = require(process.cwd() + "/siteConfig.js");

function imgUrl(img) {
  return siteConfig.baseUrl + "img/" + img;
}

function docUrl(doc, language) {
  return siteConfig.baseUrl + "docs/" + (language ? language + "/" : "") + doc;
}

function pageUrl(page, language) {
  return siteConfig.baseUrl + (language ? language + "/" : "") + page;
}

class Button extends React.Component {
  render() {
    return (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={this.props.href} target={this.props.target}>
          {this.props.children}
        </a>
      </div>
    );
  }
}

Button.defaultProps = {
  target: "_self"
};

const SplashContainer = props => (
  <div className="homeContainer">
    <div className="homeSplashFade">
      <div className="wrapper homeWrapper">{props.children}</div>
    </div>
  </div>
);

const Logo = props => (
  <div className="projectLogo">
    <img src={props.img_src} />
  </div>
);

const ProjectTitle = props => (
  <h2 className="projectTitle">
    {siteConfig.title}
    <small>{siteConfig.tagline}</small>
  </h2>
);

const PromoSection = props => (
  <div className="section promoSection">
    <div className="promoRow">
      <div className="pluginRowBlock">{props.children}</div>
    </div>
  </div>
);

class HomeSplash extends React.Component {
  render() {
    let language = this.props.language || "";
    return (
      <SplashContainer>
        <Logo img_src={imgUrl("isomorphic-git-logo.svg")} />
        <div className="inner">
          <ProjectTitle />
          <PromoSection>
            <Button href={docUrl("quickstart.html", language)}>
              Getting Started
            </Button>
            <Button href={docUrl("alphabetic.html", language)}>
              Interactive Docs
            </Button>
            <Button href="https://github.com/isomorphic-git/isomorphic-git/releases">
              Download
            </Button>
          </PromoSection>
        </div>
      </SplashContainer>
    );
  }
}

const Features = props => (
  <Container
    padding={["bottom", "top"]}
    id={props.id}
    background={props.background}
  >
    <div className="gridBlock">
      <div className="blockElement alignCenter fourByGridBlock imageAlignTop">
        <div className="isomorphic-git-browser-list">
          <img
            src="https://raw.githubusercontent.com/alrra/browser-logos/bc47e4601d2c1fd46a7912f9aed5cdda4afdb301/src/chrome/chrome.svg?sanitize=true"
            alt=""
            width="64"
            height="64"
          />
          <img
            src="https://raw.githubusercontent.com/alrra/browser-logos/bc47e4601d2c1fd46a7912f9aed5cdda4afdb301/src/edge/edge.svg?sanitize=true"
            alt=""
            width="64"
            height="64"
          />
          <img
            src="https://raw.githubusercontent.com/alrra/browser-logos/bc47e4601d2c1fd46a7912f9aed5cdda4afdb301/src/firefox/firefox.svg?sanitize=true"
            alt=""
            width="64"
            height="64"
          />
          <img
            src="https://raw.githubusercontent.com/alrra/browser-logos/bc47e4601d2c1fd46a7912f9aed5cdda4afdb301/src/safari/safari_64x64.png"
            alt=""
            width="64"
            height="64"
          />
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/64/Android_logo_2019_%28stacked%29.svg"
            alt=""
            width="64"
            height="64"
          />
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/d/d6/IOS_13_logo.svg"
            alt=""
            width="64"
            height="64"
          />
        </div>
        <div className="blockContent">
          <h2 className="isomorphic-git-browser-list-header">
            <div>
              <p>Works in All Modern Browsers</p>
            </div>
          </h2>
          <div>
            <p>
              Clone repos, create commits, push branches and more in client-side
              JS.
            </p>
          </div>
        </div>
      </div>
      <div className="blockElement alignCenter fourByGridBlock imageAlignTop isomorphic-git-browser-list-block-2">
        <div className="blockImage">
          <img src={imgUrl("nodejs-new-pantone-black.png")} />
        </div>
        <div className="blockContent">
          <h2 className="isomorphic-git-browser-list-header isomorphic-git-browser-list-header-2">
            <div>
              <span>
                <p>Works on Desktops and Servers</p>
              </span>
            </div>
          </h2>
          <div>
            <span>
              <p>
                It uses the same on-disk format as git so it works with existing repos.
              </p>
            </span>
          </div>
        </div>
      </div>
    </div>
  </Container>
);

const FeatureCallout = ({ language }) => (
  <div
    className="productShowcaseSection paddingBottom"
    style={{ textAlign: "center" }}
  >
    <h2>Features</h2>
    <ul className="isomorphic-git-feature-list">
      <li>
        <a href={docUrl("clone.html", language)} >
          <GoRepoClone size="3.5em" style={{paddingRight: '10px'}} />clone repos
        </a>
      </li>
      <li>
        <a href={docUrl("init.html", language)} >
          <GoRepo size="3.5em" style={{paddingRight: '10px'}} />init new repos
        </a>
      </li>
      <li>
        <a href={docUrl("listBranches.html", language)} >
          <GoGitBranch size="3.5em" style={{paddingRight: '10px'}} />list branches and tags
        </a>
      </li>
      <li>
        <a href={docUrl("log.html", language)} >
          <GoHistory size="3.5em" style={{paddingRight: '10px'}} />list commit history
        </a>
      </li>
      <li>
        <a href={docUrl("checkout.html", language)} >
          <GoRepoPull size="3.5em" style={{paddingRight: '10px'}} />checkout branches
        </a>
      </li>
      <li>
        <a href={docUrl("push.html", language)} >
          <GoRepoPush size="3.5em" style={{paddingRight: '10px'}} />push branches to remotes
        </a>
      </li>
      <li>
        <a href={docUrl("commit.html", language)} >
          <GoGitCommit size="3.5em" style={{paddingRight: '10px'}} />create new commits
        </a>
      </li>
      <li>
        <a href={docUrl("getConfig.html", language)} >
          <GoSettings size="3.5em" style={{paddingRight: '10px'}} />git config
        </a>
      </li>
      <li>
        <a href={docUrl("readCommit.html", language)} >
          <GoFileBinary size="3.5em" style={{paddingRight: '10px'}} />read & write raw git objects
        </a>
      </li>
      <li>
        <a href={docUrl("onSign.html", language)} >
          <GoKey size="3.5em" style={{paddingRight: '10px'}} />PGP signing
        </a>
      </li>
      <li>
        <a href={docUrl("statusMatrix.html", language)} >
          <GoDiffModified size="3.5em" style={{paddingRight: '10px'}} />file status
        </a>
      </li>
      <li>
        <a href={docUrl("merge.html", language)} >
          <GoGitMerge size="3.5em" style={{paddingRight: '10px'}} />merge branches
        </a>
      </li>
    </ul>
  </div>
);

const TryGitRemoteInfo = props => (
  <Container padding={["bottom", "top"]} id={props.id} background="light">
    <div className="try-it-out">
      <h2>Try it out!</h2>
      <label htmlFor="giturl">Enter in the URL of a git repository, and we'll retrieve the list of branches and tags using the git HTTP protocol.</label>
      <div>
        <input
          id="giturl_input"
          name="giturl"
          type="text"
          className="input"
          defaultValue="https://github.com/facebook/react"
          size="50"
          style={{ maxWidth: "80%" }}
        />
        <button
          id="giturl_button"
          type="button"
          className="button"
          value="Fetch Info"
        >
          Fetch Info
        </button>
        <div id="try-it-output">
          <div>
            <b>Branches:</b> <span id="giturl_branches"></span>
          </div>
          <div>
            <b>Tags:</b> <span id="giturl_tags"></span>
          </div>
          <p className="more">
            <em>Cool, huh?</em> There are a whole bunch more live examples in the <a href={docUrl("alphabetic.html", props.language)}>docs</a>!
          </p>
        </div>
      </div>
    </div>
  </Container>
);

const LearnHow = props => (
  <Container padding={["bottom", "top"]} id={props.id} background="light">
    <div className="gridBlock">
      <div className="blockElement fourByGridBlock">
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
    </div>
  </Container>
);

const Praise = props => {
  return (
    <div
      className="productShowcaseSection paddingBottom"
      style={{ maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}
    >
      <a
        className="twitter-moment"
        href="https://twitter.com/i/moments/1073726885362888706?ref_src=twsrc%5Etfw"
      >
        Praise for Isomorphic-Git
      </a>
    </div>
  );
};

const Showcase = props => {
  if ((siteConfig.users || []).length === 0) {
    return null;
  }
  const showcase = siteConfig.users
    .filter(user => {
      return user.pinned;
    })
    .map((user, i) => {
      return (
        <a href={user.infoLink} key={i}>
          <img src={user.image} title={user.caption} />
        </a>
      );
    });

  return (
    <div className="productShowcaseSection paddingBottom">
      <h2>{"Who's Using This?"}</h2>
      <p>This project is used by:</p>
      <div className="logos">{showcase}</div>
      <div className="more-users">
        <a className="button" href={pageUrl("users.html", props.language)}>
          More {siteConfig.title} Users
        </a>
      </div>
    </div>
  );
};

class Index extends React.Component {
  render() {
    let language = this.props.language || "";

    return (
      <div>
        <HomeSplash language={language} />
        <div className="mainContainer">
          <Features />
          <FeatureCallout language={language} />
          <LearnHow />
          <TryGitRemoteInfo language={language} />
          <Praise />
          <Showcase language={language} />
        </div>
        {this.props.config.homepagescripts &&
          this.props.config.homepagescripts.map(function (source, idx) {
            if (typeof source === 'string') {
              return (
                <script
                  defer
                  type="text/javascript"
                  key={'script' + idx}
                  src={source}
                />
              );
            } else {
              return (
                <script defer key={'script' + idx} {...source} />
              );
            }
          })}
      </div>
    );
  }
}

module.exports = Index;
