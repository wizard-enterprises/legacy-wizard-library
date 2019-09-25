import { Suite, SuiteOpts } from "."
import { TestEntityIdStore } from "../core/abstract-test-entity"

export class GlobalSuite extends Suite {
  private static instance: GlobalSuite = null
  static getInstance(opts: SuiteOpts = {}, idStore?: TestEntityIdStore): GlobalSuite {
    return this.instance || (this.instance = new GlobalSuite(opts, idStore))
  }

  protected constructor(opts: SuiteOpts = {}, idStore?) {
    super('global', {...opts, rootSuite: true}, idStore)
  }
}