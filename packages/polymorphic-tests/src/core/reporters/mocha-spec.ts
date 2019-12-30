import { Transform, PassThrough } from 'stream'
import streamToString from 'stream-to-string'
import TapMochaReporter from 'tap-mocha-reporter'
import { TapReporter } from './tap'

export class MochaSpecReporter extends TapReporter {
  async end() {
    let oldConsole = this.console,
      lines = []
    //@ts-ignore
    this.console = {log: line => lines.push(line), error: e => {oldConsole.error(e)}}
    await super.end()
    this.console = oldConsole
    let report = lines.join('\n')
    await this.makeMochaSpecReport(report)
  }

  private async makeMochaSpecReport(tapReport) {
    try {
      let pipedStream = TapMochaReporter('spec')
      pipedStream.on('error', e => {throw e})
      pipedStream.write(tapReport)
      pipedStream.end()
      await new Promise(res => setTimeout(res, 1))
    } catch (e) {
      throw e
    } finally {
      process.exit()
    }
  }
}