module.exports = {
  sourceFileGlobs: ["src/**/*.js"],
  testFileGlobs: ["test/**/*.spec.js"],
  setup: () => {
    require('@babel/register')()
    require('core-js/stable')
    require('regenerator-runtime/runtime')
  },
}