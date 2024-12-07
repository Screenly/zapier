module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/*.visual.test.js'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  setupFilesAfterEnv: ['./test/setup.visual.js'],
  testTimeout: 30000,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testRunner: 'jest-circus/runner'
};