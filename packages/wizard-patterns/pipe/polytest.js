module.exports = {
  codes: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.test.ts'],
  tests: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
  reporter: 'mochaSpec',
  setup: [() => {
    const chai = require('chai')
    chai.use(require('chai-as-promised'))
    require('ts-node/register/transpile-only')
  }]
}