module.exports = {
  testFileGlobs: ["test/**/*.spec.ts"],
  sourceFileGlobs: ["src/**/*.ts"],
  reporter: "tap",
  setup: () => {
    require('ts-node/register')
  },
}