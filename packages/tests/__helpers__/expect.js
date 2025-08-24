// This is a jest like helper based on nodejs assert.
// 1. Import from Node and your new polyfill
// import { describe, it } from 'node:test';
// import expect from './__helpers__/expect.js'; // Adjust path as needed
// import { expect }from './__helpers__/expect.js'; // Adjust path as needed
import assert from 'node:assert';

// The main function that kicks off the chain
export function expect(actual) {
  // The 'not' chain link
  const not = {
    toBeNull() {
      assert.notStrictEqual(actual, null, `Expected value not to be null, but it was.`);
    },
    // You can add more .not matchers here if needed
    // e.g., not.toEqual(), not.toBeUndefined()
  };

  // The main object returned by expect()
  return {
    // The .not property to access the inverted matchers
    not,

    /**
     * Asserts deep equality for objects and arrays, or strict equality for primitives.
     * This mirrors Jest's .toEqual() behavior.
     * @param {*} expected The expected value.
     */
    toEqual(expected) {
      // Use deepStrictEqual for objects/arrays, and strictEqual for primitives for better error messages.
      if (typeof actual === 'object' && actual !== null && typeof expected === 'object' && expected !== null) {
        assert.deepStrictEqual(actual, expected);
      } else {
        assert.strictEqual(actual, expected);
      }
    },

    /**
     * Asserts strict equality (===). Mirrors Jest's .toBe().
     * This is useful for your error code checks.
     * @param {*} expected The expected value.
     */
    toBe(expected) {
      assert.strictEqual(actual, expected);
    },

    /**
     * Dynamically access properties of the 'actual' value if it's an object.
     * This allows for the `expect(error.code).toEqual(...)` pattern.
     */
    get code() {
      if (typeof actual !== 'object' || actual === null || !('code' in actual)) {
        throw new assert.AssertionError({ message: 'Expected object to have property "code"' });
      }
      // Return a new expect instance chained to the property's value
      return expect(actual.code);
    },

    get caller() {
      if (typeof actual !== 'object' || actual === null || !('caller' in actual)) {
        throw new assert.AssertionError({ message: 'Expected object to have property "caller"' });
      }
      return expect(actual.caller);
    },
    
    // You can extend this for other properties like 'data' in the same way
    get data() {
       if (typeof actual !== 'object' || actual === null || !('data' in actual)) {
        throw new assert.AssertionError({ message: 'Expected object to have property "data"' });
      }
      return expect(actual.data);
    }
  };
}

// Export the function so it can be imported in test files
export default expect;
