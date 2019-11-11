import chalk from 'chalk'
import clear from 'clear'
import * as figlet from 'figlet'
import { composeConfig } from './utils'

export async function initProject(options: {y: boolean} = {y: false}) {
  let existingConfig = await composeConfig({}, false)
  if (Object.entries(existingConfig).length > 0)
    throw new Error('polytest config already exists either in package.json or polytest.js')
  printBanner()
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
