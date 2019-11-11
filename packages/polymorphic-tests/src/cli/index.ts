//watch: "nodemon --watch 'src/**/*.ts' --exec 'ts-node' src/index.ts"
import program from 'commander'
import * as packageJson from 'pjson'
import { TestReporterType } from '../core/reporters'
import { defaultConfig } from './index-types'
import { runTests } from './run'
import { initProject } from './init'

program
  .name('polytest')
  .description(packageJson.description)
  .version(packageJson.version, '-v, --version', "Print version")
  .helpOption('-h, --help', 'Print usage information')
  
program
  .command('run')
  .description('Run tests')
  .option('-w, --watch', 'Start in watch mode')
  .option('-b, --build-command <buildCommand>', "Run tests after build command")
  .option('-r, --reporter <reporter>', makeRunOptionDescription(
    'Select reporter from:',
    defaultConfig.reporter,
    Object.values(TestReporterType)))
  .option('--tests <testFileGlobs>', makeRunOptionDescription(
    'Globs of test files',
    defaultConfig.testFileGlobs,
  ))
  .option('--sources <sourceFileGlobs>', makeRunOptionDescription(
    'Globs of source files',
    defaultConfig.sourceFileGlobs,
  ))
  .option('--setup-files <setup>', 'Files to import first')
  .action(options => runTests(options))
  
program
  .command('init')
  .description('Setup PolyTest in project')
  .option('-y', 'Accept all default config values')
  .action(options => initProject(options))
  
if (process.argv.length <= 2)
  program.help()
program.parse(process.argv)

function makeRunOptionDescription(general: string, defaultValue: any, optionList?: string[]) {
  let description = general,
    foundDefaultValueInList = false
  if (optionList) {
    for (let option of optionList) {
      description += `\n\t * ${option}`
      if (option === defaultValue) {
        description += ' (default)'
        foundDefaultValueInList = true
      }
    }
  }
  if (!foundDefaultValueInList)
    description += `\n\tDefault: ${defaultValue}`
  return description
}
