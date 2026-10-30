module.exports = {
  testEnvironment: "node",
  setupFiles: ['<rootDir>/src/tests/setup-env.cjs'],
  testMatch: ["**/src/tests/**/*.test.js"],

  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],

  collectCoverageFrom: [
    "src/**/*.js",
    "!src/tests/**",
    "!src/index.js"
  ]
};
