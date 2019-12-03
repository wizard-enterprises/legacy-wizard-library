import { Command, flags } from '@oclif/command'
import path from 'path'
import { promises as fs, readdir } from 'fs'
import inquirer from 'inquirer'

enum PackageDependencyType {
  dependency,
  devDependency,
  any,
}

enum ProjectType {
  babel = 'babel',
  typescript = 'typescript',
}

export default class Init extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    withDefaultFor: flags.enum<ProjectType>({
      char: 'd',
      options: Object.keys(ProjectType),
      description: 'use default config for project type instead of being asked',
    })
  }

  static args = [{
    name: 'path',
    required: false,
    description: 'path to initialize in',
  }]

  async run() {
    let {args, flags} = this.parse(Init),
      projPath = await this.getProjectDir(args.path),
      packageJsonPath = path.join(projPath, 'package.json'),
      packageJson = JSON.parse((await fs.readFile(packageJsonPath)).toString())
    await this.validateDepenendencies(packageJson)
    let configString = await this.makeConfigString(projPath, flags.withDefaultFor)
    await fs.writeFile(path.join(projPath, 'polytest.js'), `module.exports = ${configString}`)
    let doesTestScriptExist = packageJson.scripts
        && packageJson.scripts.test,
      doesTestScriptUseCli = doesTestScriptExist && packageJson.scripts.test.includes('polytest run'),
      successMessage = 'polymorphic-tests init successful'

    if (doesTestScriptExist === false) {
      if (!packageJson.scripts) packageJson.scripts = {}
      packageJson.scripts.test = 'polytest run'
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
    }
    else if (doesTestScriptUseCli === false)
      successMessage += ', change package.json#scripts.test to "polytest run"'
    console.log(successMessage)
  }

  async getProjectDir(rawPath) {
    rawPath = rawPath || '.'
    let projectPath = path.resolve(process.cwd(), rawPath)
    await this.verifyDirHasFile(projectPath, 'package.json')
    await this.verifyDirDoesNotHaveFile(projectPath, 'polytest.js')
    return projectPath
  }

  async verifyDirDoesNotHaveFile(dirPath, file) {
    try {
      await this.verifyDirHasFile(dirPath, file)
    } catch {
      return
    }
    throw new Error(`Provided directory already has ${file}`)
  }

  async verifyDirHasFile(dirPath, file) {
    try {
      await fs.stat(path.join(dirPath, file))
    } catch (e) {
      throw new Error(`Provided directory doesn't contain ${file}: ${dirPath}`)
    }
  }

  validateDepenendencies(packageJson) {
    let hasDep = dep => this.doesPackageJsonHaveDependency(packageJson, dep)
    if (hasDep('polymorphic-tests') === false)
      throw new Error('No local version of `polymorphic-tests` is installed in project')
    if (hasDep('@babel/register'))
      throw new Error('@babel/register not installed in project')
  }

  doesPackageJsonHaveDependency(packageJson, dependencyName, dependencyType: PackageDependencyType = PackageDependencyType.any) {
    let Type = PackageDependencyType
    if (
      (dependencyType === Type.dependency || dependencyType === Type.any) &&
      packageJson.dependencies && packageJson.dependencies[dependencyName]
    ) return true
    if (
      (dependencyType === Type.devDependency || dependencyType === Type.any) &&
      packageJson.devDependencies && packageJson.devDependencies[dependencyName]
    ) return true
    return false
  }

  async makeConfigString(projPath: string, projectType?: ProjectType) {
    if (projectType === ProjectType.babel) return this.defaultBabelConfig
    if (projectType === ProjectType.typescript) return this.defaultTypescriptConfig
    let dirsInProjDir = (await Promise.all((await fs.readdir(projPath)).map(file =>
      fs.stat(path.join(projPath, file))
        .then(stat => stat.isDirectory ? file : null)
    ))).filter(Boolean)
    let {type, srcDir, testDir} = await inquirer.prompt([
      {
        message: `How will your project implement decorators?`,
        name: 'type',
        type: 'list',
        choices: Object.keys(ProjectType),
      }, {
        message: `Enter name of your source dir (e.g. src, not ./src)`,
        name: 'srcDir',
        validate: name => dirsInProjDir.includes(name),
      }, {
        message: `Enter name of your test dir or blank`,
        name: 'testDir',
        validate: name => !name || dirsInProjDir.includes(name),
      },
    ])
    let config = this.composeConfigStringForType(type, srcDir, testDir)
    console.log(config)
    let {confirmed} = await inquirer.prompt([
      {
        name: 'confirmed',
        message: `Confirm generated config?`,
        type: 'confirm',
      },
    ])
    if (confirmed === false) process.exit(0)
    return config
  }

  defaultBabelConfig = this.composeConfigStringForType(ProjectType.babel, 'src', 'test')
  defaultTypescriptConfig = this.composeConfigStringForType(ProjectType.typescript, 'src', 'test')

  babelSetupContent = `require('@babel/register')()`
  typescriptSetupContent = `require('ts-node/register/transpile-only')`
  composeConfigStringForType(type: ProjectType, srcDir: string, testDir?: string) {
    return type === ProjectType.babel
      ? this.composeConfigString('js', this.babelSetupContent, srcDir, testDir)
      : this.composeConfigString('ts', this.typescriptSetupContent, srcDir, testDir)
  }

  composeConfigString(ext: string, setupFuncContent: string, srcDir: string, testDir?: string) {
    let testDirString = testDir && testDir !== srcDir
      ? `, '${testDir}/**/*.spec.${ext}', '${testDir}/**/*.spec.${ext}'`
      : ''
    return `{
  codes: ['${srcDir}/**/*.${ext}', '!${srcDir}/**/*.spec.${ext}', '!${srcDir}/**/*.test.${ext}'],
  tests: ['src/**/*.spec.${ext}', 'src/**/*.test.${ext}'${testDirString}],
  reporter: 'mochaSpec',
  setup: [() => {
    ${setupFuncContent}
  }]
}`
  }
}
