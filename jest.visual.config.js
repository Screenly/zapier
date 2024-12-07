module.exports = {
  testEnvironment: 'jsdom',
  testTimeout: 30000,
  testMatch: ['**/test/**/*.visual.test.js'],
  setupFilesAfterEnv: ['./test/setup.visual.js'],
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testRunner: 'jest-circus/runner'
};