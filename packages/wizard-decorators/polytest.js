module.exports = {
  codes: ['src/**/*.js'],
  tests: ['test/**/*.spec.js'],
  reporter: 'mochaSpec',
  setup: () => {
    require('@babel/register')()
    require('core-js/stable')
    require('regenerator-runtime/runtime')
  },
}