/* eslint-env node, browser, jasmine */
import { makeFixtureAsSubmodule } from './__helpers__/FixtureFSSubmodule.js'
import { testMergeRecovery } from './__helpers__/mergeRecovery.js'

describe('merge recovery in a submodule', () =>
  testMergeRecovery(makeFixtureAsSubmodule))
