module.exports = {
  tests: ['test/**/*.spec.js'],
  codes: ['src/**/*.js', '!src/**/*.spec.js'],
  reporter: 'mochaSpec',
  setup: () => {
    require('@babel/register')()
  },
}