module.exports = {
  testRegex: '/__tests__/[^\\/]+\\.js',
  moduleNameMapper: {
    '^isomorphic-git$': '<rootDir>/src',
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
