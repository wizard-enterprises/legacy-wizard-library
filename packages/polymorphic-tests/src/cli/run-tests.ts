import globby from 'globby'
import path from 'path'
import { getReporterOfType } from '../core/reporters'
import { TestRunner } from '../core/test-runner'
import { GlobalSuite } from '../suite/global'
import { PolytestConfig } from './index-types'

let _this = this
process.on('message', (config: PolytestConfig) =>
  runGlobalSuite(parseConfig(config))
    .then(() => process.exit())
    .catch(e => {
      console.error(e)
      process.exit(1)
    }))

function parseConfig(config: PolytestConfig) {
  config.setup = parseSetup(config.setup)
  return config
}

function parseSetup(setup) {
  if (setup === `${setup}`)
    return (
      setup.match(/^\s*\(\) ?=>/) ||
      setup.match(/^\s*function ?\w*? ?\(\)/)
    )
      ? eval(setup).bind(_this)
      : setup
  if (setup instanceof Array)
    return setup.map(setup => parseSetup(setup))
  return setup
}

async function runGlobalSuite(config: PolytestConfig) {
  await importAllTestFiles(config)
  let global = GlobalSuite.getInstance(),
    reporterCtor = getReporterOfType(config.reporter),
    reporter = new reporterCtor
  global.testTimeout = config.timeout
  await new TestRunner(global, reporter).run()
}

async function importAllTestFiles(config: PolytestConfig) {
  await importOrRunSetup(config.setup)
  let testFiles = await globby(
    config.tests.map(glob =>
      path.join(process.cwd(), glob)))
  for (let file of testFiles) require(file)
}

function importOrRunSetup(setup: PolytestConfig['setup']) {
  if (setup instanceof Function) return (async () => await setup())()
  if (setup === `${setup}`)
    return globby(path.join(process.cwd(), setup))
      .then(paths => paths.map(path => require(path)))
  if (setup instanceof Array)
    return Promise.all(setup.map(c => importOrRunSetup(c)))
}
