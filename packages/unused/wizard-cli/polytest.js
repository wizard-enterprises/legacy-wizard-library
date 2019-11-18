module.exports = {
  tests: ["test/**/*.spec.js"],
  codes: ["src/**/*.js", "!src/**/*.spec.js"],
  reporter: "tap",
  setup: () => {
    require('@babel/register')()
  },
}