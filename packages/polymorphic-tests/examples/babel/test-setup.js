require('@babel/register')({
  plugins: [
    ["@babel/plugin-proposal-decorators", { "legacy": true }]
  ]
})