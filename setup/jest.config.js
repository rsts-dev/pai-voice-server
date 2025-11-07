module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage collection
  collectCoverageFrom: [
    'lib/**/*.js',
    'install.js',
    '!lib/**/*.test.js',
    '!**/node_modules/**'
  ],

  // Coverage output
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Coverage thresholds (optional, can be adjusted)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Test timeout (10 seconds)
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Reset mocks after each test
  resetMocks: true
};
