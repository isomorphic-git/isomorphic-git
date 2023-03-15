const PropTypes = require('prop-types');
/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react')
const GitHubStarButton = require('./GitHubStarButton')

class Footer extends React.Component {
  docUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl
    return baseUrl + 'docs/' + (language ? language + '/' : '') + doc
  }

  pageUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl
    return baseUrl + (language ? language + '/' : '') + doc
  }

  render() {
    return (
      <footer className='nav-footer' id='footer'>
        <section className='sitemap'>
          {this.props.config.footerIcon && (
            <a href={this.props.config.baseUrl} className="nav-home">
              <img
                src={`${this.props.config.baseUrl}${
                  this.props.config.footerIcon
                }`}
                alt={this.props.config.title}
                width="66"
                height="58"
              />
            </a>
          )}
          <div className="footerSection">
            <h5>Docs</h5>
            <a href={this.props.config.baseUrl + 'docs/' + this.props.language + '/quickstart'}>
              Getting Started
            </a>
            <a href={this.props.config.baseUrl + 'docs/' + this.props.language + '/alphabetic'}>
              API Reference
            </a>
          </div>
          <div>
            <h5>Community</h5>
            <a href={this.props.config.baseUrl + this.props.language + '/users'}>
              User Showcase
            </a>
            <a href='https://gitter.im/isomorphic-git/Lobby'>Project Chat</a>
            <GitHubStarButton />
          </div>
          <div>
            <h5>More</h5>
            <a href={this.props.config.baseUrl + 'docs/' + this.props.language + '/in-the-news'}>In The News</a>
            <a href={this.props.config.baseUrl + 'blog'}>Blog</a>
          </div>
        </section>

        {/* Correct sidebar nav scroll position */}
        <script type="text/javascript" dangerouslySetInnerHTML={{
          __html: `let el = document.querySelector('.navListItemActive'); if (el) el.scrollIntoView({ block: 'nearest' })`
        }}></script>
        {/* External scripts */}
        {this.props.config.footerscripts &&
          this.props.config.footerscripts.map(function(source, idx) {
            if (typeof source === 'string') {
              return (
                <script
                  type="text/javascript"
                  key={'script' + idx}
                  src={source}
                />
              );
            } else {
              return (
                <script key={'script' + idx} {...source} />
              );
            }
          })}

      </footer>
    )
  }
}

module.exports = Footer
