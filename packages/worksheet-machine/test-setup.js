let fs = require('fs')
require('@babel/register')({
  ...JSON.parse(fs.readFileSync('.babelrc')),
  ignore: [],
})