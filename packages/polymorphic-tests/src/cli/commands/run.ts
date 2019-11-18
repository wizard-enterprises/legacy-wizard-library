import 'source-map-support/register'
import { Command, flags } from '@oclif/command'
import globby from 'globby'
import * as path from 'path'
import { getReporterOfType, TestReporterType } from '../../core/reporters'
import { TestRunner } from '../../core/test-runner'
import { GlobalSuite } from '../../suite/global'
import { CliOptionOverrides, PolytestConfig } from '../index-types'
import { composeConfig } from '../utils'

export default class Run extends Command {
  static description = 'run tests'

  static flags = {
    help: flags.help({char: 'h'}),
    watch: flags.boolean({char: 'w', description: 'run in watch mode'}),
    timeout: flags.integer({char: 'i', description: 'default timeout for tests'}),
    reporter: flags.enum<TestReporterType>({
      char: 'r',
      options: Object.keys(TestReporterType),
      description: `reporter to handle test run`,
    }),
    tests: flags.string({
      char: 't',
      multiple: true,
      description: 'globs of test files',
    }),
    codes: flags.string({
      char: 'c',
      multiple: true,
      description: 'globs of code files',
    }),
    setup: flags.string({
      char: 's',
      multiple: true,
      description: 'globs of setup files',
    }),
  }
  
  async run() {
    const {flags} = this.parse(Run)
    await this.runTests(flags)
  }
  
  async runTests(options: CliOptionOverrides = {}) {
    let config = await composeConfig(options)
    await this.runGlobalSuite(config)
  }

  async runGlobalSuite(config: PolytestConfig) {
    await this.importAllTestFiles(config)
    let global = GlobalSuite.getInstance(),
      reporterCtor = getReporterOfType(config.reporter),
      reporter = new reporterCtor
    reporter['console'] = this
    global.testTimeout = config.timeout
    await new TestRunner(global, reporter).run()
  }

  async importAllTestFiles(config: PolytestConfig) {
    await this.importOrRunSetup(config.setup)
    let testFiles = await globby(
      config.tests.map(glob =>
        path.join(process.cwd(), glob)))
    await Promise.all(testFiles.map(file => import(file)))
  }

  importOrRunSetup(setup: PolytestConfig['setup']) {
    if (setup instanceof Function) return (async () => await setup())()
    if (setup === `${setup}`)
      return globby(path.join(process.cwd(), setup))
        .then(paths => paths.map(path => import(path)))
    if (setup instanceof Array)
      return Promise.all(setup.map(c => this.importOrRunSetup(c)))
  } 

}
