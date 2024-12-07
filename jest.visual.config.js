module.exports = {
  testEnvironment: 'jsdom',
  testTimeout: 30000,
  testMatch: process.env.CI ? ['**/test/**/*.visual.test.js'] : [],
  setupFilesAfterEnv: ['./test/setup.visual.js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testRunner: 'jest-circus/runner'
};