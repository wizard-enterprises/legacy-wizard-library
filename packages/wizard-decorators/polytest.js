module.exports = {
  codes: ["src/**/*.js"],
  tests: ["test/**/*.spec.js"],
  setup: () => {
    require('@babel/register')()
    require('core-js/stable')
    require('regenerator-runtime/runtime')
  },
}