/* eslint-env node, browser, jasmine */
import { makeFixture } from './__helpers__/FixtureFS.js'
import { testMergeRecovery } from './__helpers__/mergeRecovery.js'

describe('merge recovery', () => testMergeRecovery(makeFixture))
