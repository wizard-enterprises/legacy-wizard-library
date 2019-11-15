import * as path from 'path'
import { promises as fs } from 'fs'
import  parse from 'yargs-parser'

export async function run(commandsDirPath, argv = process.argv.slice(2)) {
  // let args = parse(argv, this.getYargsOpts()),
  let cliMetadata = await getCliMetadata(commandsDirPath),
    rootCommand = Object.entries(cliMetadata)[0],
    command = findCommand(rootCommand[1], argv),
    cmdCtor = require(command.path).default,
    cmdInstance = new cmdCtor
  return runCommand(command, args)
}

function findCommand(rootCommand, argv) {
  let command = rootCommand,
    removeFromArgs = 0
  for (let cmd of argv) {
    if (!command.subCommands || !command.subCommands[cmd])
      break
    command = command.subCommands[cmd]
    removeFromArgs++
  }
  while (removeFromArgs-- !== 0) argv.shift()
  return command
}

function runCommand(command, args) {
  let Command = require(command.path).default,
    cmdInstance = new Command,
    runArgs = cmdInstance.validateAndParseArgs(...args._)
  return cmdInstance.run(...runArgs)
}

async function getCliMetadata(commandsDirPath) {
  let cliMetadataPath = path.join(commandsDirPath, 'cli-metadata.json')
  await verifyMetadataFileExists(cliMetadataPath)
  return parseMetadataFile(cliMetadataPath)
}

async function verifyMetadataFileExists(path) {
  try {
    await fs.stat(path)
  } catch (e) {
    throw new Error(`CLI metadata file doesn't exist at ${path}`)
  }
}

async function parseMetadataFile(path) {
  try {
    return JSON.parse(await fs.readFile(path))
  } catch (e) {
    throw new Error(`Couldn't parse CLI metadata file at ${path}`)
  }
}