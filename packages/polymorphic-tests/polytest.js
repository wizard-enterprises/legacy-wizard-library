module.exports = {
  tests: ['test/**/*.spec.ts'],
  codes: ['lib/**/*.js'],
  reporter: 'mochaSpec',
  setup: () => {
    const chai = require('chai')
    chai.use(require('chai-shallow-deep-equal'))
    require('ts-node/register/transpile-only')
  },
}