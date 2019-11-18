module.exports = {
  tests: ['test/**/*.spec.ts'],
  codes: ['src/**/*.ts'],
  reporter: 'tap',
  setup: () => {
    require('ts-node/register/transpile-only')
  },
}