import { transformAsync } from '@babel/core'
import { promises as fs } from 'fs'
import * as path from 'path'
import { Suite, Test, TestSuite } from 'polymorphic-tests'
import rimraf from 'rimraf'
import { run } from '../src/runner'

@Suite() class CliRunnerSuite extends TestSuite {
  async after(t) {
    if (this.tempDir) await this.tempDir.destroy()
    await super.after(t)
  }

  @Test() async 'run simple command'(t) {
    await this.makeCommandsDir({
      run() {
        return 'foo'
      },
    })
    t.expect(await this.run()).to.equal('foo')
  }

  @Test() async 'run command with dependency'(t) {
    await this.makeCommandsDir(
      ['path'], {
        run() {
          return path.join(__dirname, 'somefile.txt') 
        },
      }
    )
    t.expect(await this.run()).to.equal(
      path.join(this.tempDir.path, 'somefile.txt'))
  }

  @Test() async 'command with arguments'(t) {
    await this.makeCommandsDir({
      args: [
        {anyArg: '*'},
        {restArg: ['rest', '*']},
      ],
      run(anyArg, ...restArg) {
        if (anyArg !== 'anything at all') throw new Error(`Unexpected anyArg: ${anyArg}`)
        if (restArg.length !== 3) throw new Error(`Expected 3 rest args, got ${restArg.length}: ${restArg}`)
        if (restArg[0] !== 'first rest arg') throw new Error(`Unexpected restArg[0]: ${restArg[0]}`)
        if (restArg[1] !== 2) throw new Error(`Unexpected restArg[1]: ${restArg[1]}`)
        if (restArg[2] !== true) throw new Error(`Unexpected restArg[2]: ${restArg[2]}`)
        return 'success'
      }
    })
    t.expect(await this.run('"anything at all" "first rest arg" 2 true')).to.equal('success')
  }

  @Test() async 'invalid command argument types'(t) {
    await this.makeCommandsDir({
      args: [
        {stringArg: ''},
        {numberArg: 0},
        {boolArg: true},
        {alsoBoolArg: false},
        {jsonObject: {}},
        {jsonArray: []},
      ],
      run(string, number, bool, alsoBool, jsonObject, jsonArray) {
        if (string !== `${string}`) throw new Error(`stringArg invalid: ${string}`)
        if (number !== Number(number)) throw new Error(`numberArg invalid: ${number}`)
        if (bool !== !!bool) throw new Error(`boolArg invalid: ${bool}`)
        if (alsoBool !== !!alsoBool) throw new Error(`alsoBoolArg invalid: ${alsoBool}`)
        if (!(jsonObject instanceof Object && !(jsonObject instanceof Array) && Object.entries(jsonObject).length === 0))
          throw new Error(`jsonObject invalid: ${jsonObject} is string: ` + (`${jsonObject}` === jsonObject))
        if (!(jsonArray instanceof Array && jsonArray.length === 0)) throw new Error(`jsonArray invalid: ${jsonArray}`)
        return 'success'
      }
    })
    t.expect(await this.run('some-string 10 false true {} []')).to.equal('success')
  }

  @Test() async 'run cli with subcommand'(t) {
    await this.makeCommandsDir({
      run() {
        return 'root command'
      },
      subCommands: {
        'sub-command': {
          run() {
            return 'sub command'
          }
        }
      }
    })
    t.expect(await this.run()).to.equal('root command')
    t.expect(await this.run('sub-command')).to.equal('sub command')
  }

  @Test({skip: true}) async 'subcommands take precedence over arguments'(t) {}

  @Test({skip: true}) async 'subcommand with multiple names'(t) {
    await this.makeCommandDir({
      subCommands: {
        'name1,name2': {
          run() {
            return 'sub command'
          }
        }
      }
    })
    t.expect(await this.run('name1')).to.equal('sub command')
    t.expect(await this.run('name2')).to.equal('sub command')
  }

  run(cliArgs = '') {
    return run(this.tempDir.path, cliArgs)
  }

  async makeCommandsDir(...args) {
    let {dependencies, rootCommand, rootCommandName} = this.parseMakeCommandsDirArgs(...args)
    let tempDir = this.tempDir = await new TempCommandsDir().init(),
      command = {
        path: tempDir.rootPath,
        name: rootCommandName,
        ...rootCommand,
      },
      babelOptions = JSON.parse(await fs.readFile(path.resolve(__dirname, '../.babelrc'))),
      metadata = await this.makeCommandDir(command, dependencies, babelOptions)
    console.log('got metadata', JSON.stringify(metadata, null, 2))

    await tempDir.writeFile(tempDir.metadataPath, JSON.stringify(metadata))
  }

  parseMakeCommandsDirArgs(...args) {
    let toArgsObj = (dependencies, rootCommand, rootCommandName) => ({
      dependencies: [
        {c: path.resolve(__dirname, '../src')},
        ...(dependencies || [])
      ],
      rootCommand,
      rootCommandName: rootCommandName || 'test-cli',
    })
    return toArgsObj(...(() => {
      if (args[0] instanceof Array)
        return args
      else
        return [null, ...args]
    })())
  }
  
  async makeCommandDir(command, dependencies, babelOptions) {
    await this.generateCommandFile(command, dependencies, babelOptions)
    if (!command.subCommands) return this.makeCommandMetadata(command)
    let subCommandsDirPath = await this.makeSubCommandsDir(command)
    return Promise.all(Object.entries(command.subCommands).map(([name, cmd]) =>
      this.makeCommandDir(
        {
          ...cmd,
          name,
          path: path.join(subCommandsDirPath, name)
        },
        dependencies,
        babelOptions
      )))
        .then(metadatas => this.makeCommandMetadata(command, metadatas))
  }

  async makeSubCommandsDir(command) {
    let dirPath = path.join(path.dirname(command.path), 'sub-commands')
    await fs.mkdir(dirPath)
    return dirPath
  }

  makeCommandMetadata(command, subCommandMetadatas) {
    let metadata = {[command.name]: {path: command.path}}
    if (command.subCommands)
      metadata[command.name].subCommands = subCommandMetadatas.reduce((acc, metadata) => ({
        ...acc,
        ...metadata,
      }), {})
    return metadata 
  }

  async generateCommandFile(command, dependencies, babelOptions) {
    let content = dependencies
      .map(rawDep => {
        let [name, dep] = (`${rawDep}` === rawDep)
          ? new Array(2).fill(rawDep)
          : Object.entries(rawDep)[0]
        return `import * as ${name} from '${dep}'`
      })
      .join('\n') + '\n' + `
export default @c.command('${command.name}') class GeneratedCommand extends c.CliCommand {
  ${ command.args ? '@c.args(' + JSON.stringify(command.args) + ')' : '' }
  ${ command.run.toString() }
}`
    console.log('generating command file', command.name, '\n' + content)
    let transformed = await transformAsync(content, babelOptions)
    await this.tempDir.writeFile(command.path, transformed.code)
  }
}

class TempCommandsDir {
  init() {
    let pathPrefix = path.join(__dirname, 'wizard-cli-test-')
    return fs.mkdtemp(pathPrefix).then(path => {
      this.path = path
      return this
    })
  }

  destroy() {
    return new Promise((resolve, reject) =>
      rimraf(this.path, e =>
        e ? reject(e) : resolve()))
  }

  writeFile(path, ...args) {
    return fs.writeFile(this.normalizePath(path), ...args)
  }

  normalizePath(pathToNormalize) {
    return path.isAbsolute(pathToNormalize)
      ? pathToNormalize
      : this.innerPath(pathToNormalize)
  }

  get metadataPath() { return this.innerPath('cli-metadata.json') }
  get configPath() { return this.innerPath('wizard-cli.config.json') }
  get rootPath() { return this.innerPath('index.js') }

  innerPath(relative) {
    return path.resolve(this.path, relative)
  }
}
