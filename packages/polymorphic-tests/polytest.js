module.exports = {
  tests: ['test/**/*.spec.ts'],
  codes: ['lib/**/*.js'],
  setup: () => {
    const chai = require('chai')
    chai.use(require('chai-shallow-deep-equal'))
  },
}