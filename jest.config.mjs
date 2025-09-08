// jest.config.mjs
export default {
  testEnvironment: "node",
  transform: { "^.+\\.js$": "babel-jest" },
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)", // matches __tests__/app.test.js
    "**/tests/**/*.test.[jt]s?(x)", // matches tests/app.test.js
  ],
};
