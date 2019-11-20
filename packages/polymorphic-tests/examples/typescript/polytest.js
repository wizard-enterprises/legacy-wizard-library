module.exports = {
  tests: ['src/*.spec.ts'],
  codes: ['src/*.ts', '!src/*.spec.ts'],
  reporter: 'mochaSpec',
  setup: () => {
    require('ts-node/register/transpile-only')
  },
}