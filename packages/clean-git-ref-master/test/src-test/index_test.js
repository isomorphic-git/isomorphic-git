'use strict';

const assert = require('chai').assert;
const spawn = require('child_process').spawn;
const cleanGitRef = require('../../src/index');

function assertValidBranchName(branchName) {
  const checkRefFormat = spawn('git', ['check-ref-format', 'refs/' + branchName]);

  return new Promise((resolve, reject) => {
    checkRefFormat.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject();
    });
  });
}

function assertOutputAndVerifyValid(input, output) {
  it("should convert '" + input + "' to '" + output + "'", () => {
    const result = cleanGitRef.clean(input);
    assert.strictEqual(result, output);
    return assertValidBranchName(result);
  });
}

describe('CleanGitRef', () => {
  describe('clean', () => {
    it('should throw if given a non string', () => {
      assert.throws(() => {
        cleanGitRef.clean(4);
      });

      assert.throws(() => {
        cleanGitRef.clean({});
      });

      assert.throws(() => {
        cleanGitRef.clean([]);
      });
    });

    assertOutputAndVerifyValid('foo./bar', 'foo/bar');
    assertOutputAndVerifyValid('foo..bar', 'foo.bar');
    assertOutputAndVerifyValid('foo bar', 'foo-bar');

    assertOutputAndVerifyValid('~foo', 'foo');
    assertOutputAndVerifyValid('^foo', 'foo');
    assertOutputAndVerifyValid(':foo', 'foo');
    assertOutputAndVerifyValid('?foo', 'foo');
    assertOutputAndVerifyValid('*foo', 'foo');
    assertOutputAndVerifyValid('-foo', 'foo');

    assertOutputAndVerifyValid('foo~', 'foo');
    assertOutputAndVerifyValid('foo^', 'foo');
    assertOutputAndVerifyValid('foo:', 'foo');
    assertOutputAndVerifyValid('foo?', 'foo');
    assertOutputAndVerifyValid('foo*', 'foo');
    assertOutputAndVerifyValid('foo-', 'foo');

    assertOutputAndVerifyValid('foo~bar', 'foo-bar');
    assertOutputAndVerifyValid('foo^bar', 'foo-bar');
    assertOutputAndVerifyValid('foo:bar', 'foo-bar');
    assertOutputAndVerifyValid('foo?bar', 'foo-bar');
    assertOutputAndVerifyValid('foo*bar', 'foo-bar');

    assertOutputAndVerifyValid('foo-bar/', 'foo-bar');
    assertOutputAndVerifyValid('foo/bar/', 'foo/bar');
    assertOutputAndVerifyValid('foo/bar.', 'foo/bar');
    assertOutputAndVerifyValid('foo/bar.lock.', 'foo/bar');
    assertOutputAndVerifyValid('foo/bar.lock/', 'foo/bar');
    assertOutputAndVerifyValid('foo/bar.lock', 'foo/bar');
    assertOutputAndVerifyValid('foo@{bar', 'foo-bar');
    assertOutputAndVerifyValid('foo\\bar', 'foo-bar');
    assertOutputAndVerifyValid('bad git ref formats/', 'bad-git-ref-formats');
  });
});
