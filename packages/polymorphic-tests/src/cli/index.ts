//watch: "nodemon --watch 'src/**/*.ts' --exec 'ts-node' src/index.ts"
import chalk from 'chalk'
import clear from 'clear'
import program from 'commander'
import * as figlet from 'figlet'
import * as fs from 'fs-extra'
import globby from 'globby'
import * as path from 'path'
import * as packageJson from 'pjson'
import 'source-map-support/register'
import { getReporterOfType, TestReporterType } from '../core/reporters'
import { TestRunner } from '../core/test-runner'
import { GlobalSuite } from '../suite/global'

interface PolytestConfig {
  reporter: TestReporterType
  timeout: number,
  testFileGlobs: string[]
  sourceFileGlobs: string[]
  setupFiles?: string[]
}

const defaultConfig: PolytestConfig = {
  reporter: TestReporterType.simple,
  timeout: 2000,
  testFileGlobs: [
    `(src|app|lib|build|dist)/**/*.(spec|test).js`,
    `(src|app|lib|build|dist)/**/__tests__/**/*.js`
  ],
  sourceFileGlobs: [
    `(src|app|lib|build|dist)/**/*.js`,
    `!(src|app|lib|build|dist)/**/*.(spec|test).js`,
  ],
  setupFiles: [],
}

type CliOptionOverrides = Partial<PolytestConfig>;

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
  .option('--setup-files <setupFiles>', 'Files to import first')
  .action(options => runTests(options))
  
program
  .command('init')
  .description('Setup PolyTest in project')
  .option('-y', 'Accept all default config values')
  .action(options => new Promise(resolve => setTimeout(() => resolve(console.log('in timeout')), 1)))
  
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

function printBanner() {
  clear()
  console.log(
    chalk.blueBright(
      "\n      Wizard Enterprises Presents"
    )
  )
  console.log(
    chalk.blueBright(
      figlet.textSync('PolyTest')
    ),
  )
}

async function runTests(options: CliOptionOverrides = {}) {
  let config = await composeConfig(options)
  await runGlobalSuite(config)
}

async function composeConfig(options: CliOptionOverrides = {}) {
  let composed: Partial<PolytestConfig> = {},
    merged = mergeConfigs(
      defaultConfig,
      (await readConfigFromPackageJson()),
      (await readConfigFromConfigFile()),
      options as PolytestConfig,
    )
  for (let key of Object.keys(defaultConfig))
    composed[key] = merged[key]
  return composed as PolytestConfig
}

function mergeConfigs(...configs: PolytestConfig[]) {
  let omitIrrelevantValues = obj => {
    let o = {...obj}
    Object.keys(o).filter(k => !Object.keys(defaultConfig).includes(k) || !o[k] || o[k].length === 0).forEach(k => delete o[k])
    return o as Partial<PolytestConfig>
  }
  return Object.assign({}, ...configs.map(omitIrrelevantValues)) as PolytestConfig
}

async function readConfigFromPackageJson() {
  return packageJson['polytest'] || {}
}

function readConfigFromConfigFile() {
  return readJsonFileInCurrentWorkingDir('polytest.json')
}

async function readJsonFileInCurrentWorkingDir(fileName: string) {
  let filePath = path.join(process.cwd(), fileName),
    content
  try {
    content = await fs.readFile(filePath, {encoding: 'utf-8'})
  } catch (e) {}
  if (!content)
    return {}
  try {
    return JSON.parse(content)
  } catch (e) {
    console.warn(`Failed to JSON.parse contents of ${filePath}, continuing with {}`)
    return {}
  }
}

async function runGlobalSuite(config: PolytestConfig) {
  await importAllTestFiles(config)
  let global = GlobalSuite.getInstance(),
    reporterCtor = getReporterOfType(config.reporter)
  global.testTimeout = config.timeout
  await new TestRunner(global, new reporterCtor).run()
}

async function importAllTestFiles(config: PolytestConfig) {
  let testFiles = await globby([...(config.setupFiles || []), ...config.testFileGlobs].map(glob =>
    path.join(process.cwd(), glob)))
  await Promise.all(testFiles.map(file => import(file)))
}
