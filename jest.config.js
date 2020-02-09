module.exports = {
  testRegex: '/__tests__/(server-only\\.)?test-[^\\/]+\\.js',
  moduleNameMapper: {
    '^isomorphic-git$': '<rootDir>/src',
    '^isomorphic-git/http$': '<rootDir>/src/builtin-node/http.js',
    '^isomorphic-git/(.+)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: ['src/*.js', 'src/**/*.js'],
  testEnvironment: 'node',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        output: `./junit/TESTS-node-${process.version}-${
          process.platform
        }-${require('os').release()}.xml`
      }
    ]
  ],
  coverageReporters: ['lcov', 'cobertura']
}
