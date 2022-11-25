module.exports = {
  modulePathIgnorePatterns: ['<rootDir>/website'],
  testRegex: '/__tests__/(server-only\\.)?test-[^\\/]+\\.js',
  moduleNameMapper: {
    '^isomorphic-git$': '<rootDir>/src',
    '^isomorphic-git/http$': '<rootDir>/http/node',
    '^isomorphic-git/(.+)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/*.js', 'src/**/*.js'],
  testEnvironment: 'node',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'junit',
        outputName: `TESTS-node-${process.version}-${process.platform}-${require('os').release()}.xml`,
      },
    ],
  ],
  coverageReporters: ['lcov', 'cobertura'],
}
