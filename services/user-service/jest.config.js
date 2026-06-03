module.exports = {
  testEnvironment: 'node',
  // Look for test files anywhere inside src/tests/
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',   // don't count test files themselves
  ],
  coverageThreshold: {
    global: {
      lines:     80,
      functions: 80,
      branches:  70,
      statements: 80,
    },
  },
  // Output coverage in multiple formats
  // text = terminal output, lcov = HTML report Jenkins can publish
  coverageReporters: ['text', 'lcov', 'json-summary'],
};