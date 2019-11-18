module.exports = {
  tests: ["src/*.spec.js"],
  codes: ["src/*.js", "!src/*.spec.js"],
  reporter: "simple",
  setup: () => {
    require('@babel/register')()
  },
}