// jest.config.mjs
export default {
  testEnvironment: "node",
  transform: { "^.+\\.js$": "babel-jest" },
  testMatch: ["<rootDir>/tests/**/*.test.js"],
};
