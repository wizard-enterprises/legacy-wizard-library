module.exports = {
  codes: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.test.ts'],
  tests: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
  reporter: 'mochaSpec',
  setup: [() => {
    require('ts-node/register/transpile-only')
  }]
}