import { Suite, SuiteOpts } from "."

export class GlobalSuite extends Suite {
  private static instance: GlobalSuite = null
  static getInstance(opts: SuiteOpts = {}): GlobalSuite {
    return this.instance || (this.instance = new GlobalSuite(opts))
  }

  protected constructor(opts: SuiteOpts = {}) {
    super('global', {...opts, rootSuite: true})
  }
}