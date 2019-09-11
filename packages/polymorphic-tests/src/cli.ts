//watch: "nodemon --watch 'src/**/*.ts' --exec 'ts-node' src/index.ts"

const packageJson = require('../package.json')
import chalk from 'chalk'
import clear from 'clear'
import * as figlet from 'figlet'
import * as path from 'path'
import program from 'commander'

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

program
  .version(packageJson.version)
  .description(packageJson.description)