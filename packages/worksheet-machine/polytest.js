module.exports = {
  tests: ["src/**/*.spec.js"],
  codes: ["src/**/*.js", "!src/**/*.spec.js"],
  reporter: "tap",
  setup: () => {
    require('@babel/register')()
    process.setMaxListeners(Infinity)
  },
}