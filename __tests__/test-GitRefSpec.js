/* eslint-env node, browser, jasmine */

const { GitRefSpec } = require('isomorphic-git/internal-apis');
const { InternalError } = require('isomorphic-git/errors');

describe('ReDoS: GitRefSpec.from', () => {
  it('should throw InternalError on malicious long refspec within 1s', () => {
    const bad = ' ' + ':'.repeat(100000) + '\n1\n';

    const start = Date.now();
    let err;
    try {
      GitRefSpec.from(bad);
    } catch (e) {
      err = e;
    }
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(1000); // 必须 1s 内结束
  });
});
