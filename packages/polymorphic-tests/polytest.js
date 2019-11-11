module.exports = {
  testFileGlobs: ['lib/(src|test)/**/*.spec.js'],
  sourceFileGlobs: ['lib/src/**/*.js'],
  setup: () => {
    const chai = require('chai')
    chai.use(require('chai-shallow-deep-equal'))
  },
}