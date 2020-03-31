module.exports = {
  codes: ['src/**/*.ts'],
  tests: ['test/**/*.ts'],
  reporter: 'mochaSpec',
  setup: [() => {
    require('ts-node/register/transpile-only')
  }]
}