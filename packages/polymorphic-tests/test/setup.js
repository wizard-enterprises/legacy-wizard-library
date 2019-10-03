const chai = require('chai'),
  chaiSubset = require('chai-subset'),
  chaiAsPromised = require('chai-as-promised')
chai.use(chaiSubset)
chai.use(chaiAsPromised)