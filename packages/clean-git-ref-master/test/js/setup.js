'use strict';

const chai = require('chai');

chai.config.includeStack = true;

chai.assert.equal = function() {
  throw new Error("Chai's assert.equal function does == instead of ===. Use assert.strictEqual instead");
};
