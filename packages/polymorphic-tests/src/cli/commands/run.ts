import 'source-map-support/register'
import { Command, flags } from '@oclif/command'
import { fork } from 'child_process'
import watch from 'glob-watcher'
import { TestReporterType } from '../../core/reporters'
import { PolytestConfig } from '../index-types'
import { composeConfig } from '../run-helpers'

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
    let {flags} = this.parse(Run),
      config = await composeConfig(flags)
    return flags.watch
      ? this.startWatchMode(config)
      : this.runTests(config).then(() => process.exit())
  }

  async startWatchMode(config: PolytestConfig) {
    console.log('Starting in watch mode, Ctrl+C to stop.')
    let allGlobs = this.getAllGlobsFromConfig(config),
      watcher = watch(allGlobs, {awaitWriteFinish: true})
    for (let event of ['ready', 'all'])
      watcher.on(event, () => this.runTests(config, event === 'ready' ? null : 'Rerunning...'))
  }

  getAllGlobsFromConfig(config: PolytestConfig) {
    let setupGlobs = (config.setup instanceof Array ? config.setup : [config.setup])
      .filter(setup => setup === `${setup}`)
    return [...setupGlobs , ...config.codes, ...config.tests] as string[]
  }

  private runTestsScriptPath = require.resolve('../run-tests')
  runTests(config: PolytestConfig, log?: string) {
    if (log) console.log(log)
    return new Promise((resolve, reject) => {
      config = this.parseConfigForFork(config)
      try {
        let runScript = fork(this.runTestsScriptPath)
        runScript.send(config)
        let rejected = false
        runScript.on('error', e => {
          rejected = true
          reject(e)
        })
        runScript.on('exit', m => {
          if (rejected === false) {
            if (runScript.killed === false) runScript.kill()
            resolve(m)
          } 
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  parseConfigForFork(config: PolytestConfig) {
    config.setup = this.parseConfigSetupForFork(config.setup)
    return config
  }

  parseConfigSetupForFork(setup: PolytestConfig['setup']) {
    if (setup instanceof Array)
      return setup.map(setup => this.parseConfigSetupForFork(setup))
    if (setup instanceof Function)
      return setup.toString()
    return setup
  }
}
