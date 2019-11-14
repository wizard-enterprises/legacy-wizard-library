import 'source-map-support/register'
import globby from 'globby'
import * as path from 'path'
import { getReporterOfType } from '../core/reporters'
import { TestRunner } from '../core/test-runner'
import { GlobalSuite } from '../suite/global'
import { CliOptionOverrides, PolytestConfig } from './index-types'
import { composeConfig } from './utils'

export async function runTests(options: CliOptionOverrides = {}) {
  let config = await composeConfig(options)
  await runGlobalSuite(config)
}

async function runGlobalSuite(config: PolytestConfig) {
  await importAllTestFiles(config)
  let global = GlobalSuite.getInstance(),
    reporterCtor = getReporterOfType(config.reporter)
  global.testTimeout = config.timeout
  await new TestRunner(global, new reporterCtor).run()
}

async function importAllTestFiles(config: PolytestConfig) {
  await importOrRunSetup(config.setup)
  let testFiles = await globby(
    config.testFileGlobs.map(glob =>
      path.join(process.cwd(), glob)))
  await Promise.all(testFiles.map(file => import(file)))
}

function importOrRunSetup(setup: PolytestConfig['setup']) {
  if (setup instanceof Function) return setup()
  if (setup === `${setup}`)
    return globby(path.join(process.cwd(), setup))
      .then(paths => paths.map(path => import(path)))
  if (setup instanceof Array)
    return Promise.all(setup.map(importOrRunSetup))
} 
