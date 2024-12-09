module.exports = {
  testEnvironment: 'node',
  testTimeout: 10000,
  testPathIgnorePatterns: ['/node_modules/', '\\.visual\\.test\\.js$'],
  collectCoverageFrom: ['*.js', '!jest.config.js', '!jest.visual.config.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|fetch-blob|formdata-polyfill|data-uri-to-buffer|web-streams-polyfill)/)',
  ],
};
