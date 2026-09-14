module.exports = {
  testEnvironment: "node",
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