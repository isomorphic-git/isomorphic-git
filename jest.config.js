module.exports = {
  'testRegex': '/__tests__/[^\\/]+\\.js',
  'moduleNameMapper': {
    '^isomorphic-git$': '<rootDir>/src',
    '^isomorphic-git/(.+)$': '<rootDir>/src/$1'
  },
  'coveragePathIgnorePatterns': [
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/__helpers__'
  ],
  'testEnvironment': 'node',
  'reporters': [
    'default',
    ['jest-junit', {
      output: `./junit/TESTS-node-${process.version}-${process.platform}-${require('os').release()}.xml`
    }]
  ],
  'coverageReporters': [
    'lcov',
    'cobertura'
  ]
}
