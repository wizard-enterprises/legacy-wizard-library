module.exports = {
  testFileGlobs: ["src/*.spec.js"],
  sourceFileGlobs: ["src/*.js", "!src/*.spec.js"],
  reporter: "simple",
  setup: () => {
    require('@babel/register')()
  },
}