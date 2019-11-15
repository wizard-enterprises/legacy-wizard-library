module.exports = {
  testFileGlobs: ["test/**/*.spec.js"],
  sourceFileGlobs: ["src/**/*.js", "!src/**/*.spec.js"],
  reporter: "tap",
  setup: () => {
    require('@babel/register')()
  },
}