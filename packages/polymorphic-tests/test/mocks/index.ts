import { GlobalSuite } from '../../lib/suite/global'
import { SuiteOpts } from '../../lib/suite'
import { DecoratorConfig } from '../../lib/public-api/decorators'
import { TestEntityIdStore } from '../../lib/core/abstract-test-entity'

export * from './console'

export class GlobalSuiteForTests extends GlobalSuite {
  static getNewInstance(opts: SuiteOpts = {}) {
    return new GlobalSuite(opts)
  }
}

export class DecoratorConfigForTests extends DecoratorConfig {
  static getNewInstance() {
    return new DecoratorConfig
  }
}

export class TestEntityIdStoreForTests extends TestEntityIdStore {
  static getNewInstance() {
    return new TestEntityIdStore
  }
}
