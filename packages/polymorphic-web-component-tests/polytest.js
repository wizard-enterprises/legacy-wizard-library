module.exports = {
  tests: ['test/**/*.spec.ts'],
  codes: ['src/**/*.ts'],
  reporter: 'mochaSpec',
  setup: () => {
    require('ts-node/register/transpile-only')
  },
}