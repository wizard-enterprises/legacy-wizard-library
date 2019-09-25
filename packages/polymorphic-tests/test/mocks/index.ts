import { GlobalSuite } from '../../src/suite/global'
import { SuiteOpts } from '../../src/suite'
import { DecoratorConfig } from '../../src/public-api/decorators'
import { TestEntityIdStore } from '../../src/core/abstract-test-entity'

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
