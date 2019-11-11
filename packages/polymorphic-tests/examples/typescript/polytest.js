module.exports = {
  testFileGlobs: ["src/*.spec.ts"],
  sourceFileGlobs: ["src/*.ts", "!src/*.spec.ts"],
  reporter: "simple",
  setup: () => {
    require('ts-node/register')
  },
}