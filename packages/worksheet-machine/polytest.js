module.exports = {
  testFileGlobs: ["src/**/*.spec.js"],
  sourceFileGlobs: ["src/**/*.js", "!src/**/*.spec.js"],
  reporter: "tap",
  setup: () => {
    require('@babel/register')()
    process.setMaxListeners(Infinity)
  },
}