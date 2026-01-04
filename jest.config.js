module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/node_modules/**',
    '!backend/coverage/**'
  ],
  testMatch: [
    '**/backend/**/*.test.js',
    '**/backend/**/*.spec.js'
  ],
  testTimeout: 10000
};
