module.exports = {
  tests: ['src/*.spec.js'],
  codes: ['src/*.js', '!src/*.spec.js'],
  reporter: 'mochaSpec',
  setup: () => {
    require('@babel/register')()
  },
}