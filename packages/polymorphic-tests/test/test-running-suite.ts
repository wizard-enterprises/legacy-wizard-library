import { GlobalSuite } from "../src/suite/global"
import { DecoratorConfig } from "../src/public-api/decorators"
import { TestEntityRegistery } from "../src/core/test-registery"
import { GlobalSuiteForTests, DecoratorConfigForTests, ConsoleSpy, TestEntityIdStoreForTests } from "./mocks"
import { TestReporter } from "../src/core/reporters/test-reporter"
import { SimpleTestReporter } from "../src/core/reporters/simple"
import { TestRunner } from "../src/core/test-runner"
import { Suite as InternalSuite } from '../src/suite'
import { TestSuite } from "../src/public-api"
import { TestEntityIdStore } from "../src/core/abstract-test-entity"

export class TestRunningSuite extends TestSuite {
  protected globalSuite: GlobalSuite
  protected decoratorConfig: DecoratorConfig
  protected registery: TestEntityRegistery
  protected consoleSpy: ConsoleSpy
  protected idStore: TestEntityIdStore
  protected reporter?: TestReporter = null

  before() {
    this.globalSuite = GlobalSuiteForTests.getNewInstance()
    this.decoratorConfig = DecoratorConfigForTests.getNewInstance()
    this.idStore = TestEntityIdStoreForTests.getNewInstance()
    this.registery = new TestEntityRegistery(this.globalSuite, this.idStore)
    this.decoratorConfig.registery = this.registery
    this.consoleSpy = new ConsoleSpy
    this.reporter = null
  }
  
  protected async getReportByRunningSuite(
    rootSuite: InternalSuite = this.globalSuite,
    reporterCtor: typeof TestReporter = SimpleTestReporter
  ) {
    await this.runSuite(rootSuite, reporterCtor)
    return new TestReportForTests(this.consoleSpy)
  }

  protected async runSuite(
    rootSuite: InternalSuite = this.globalSuite,
    reporterCtor: typeof TestReporter = SimpleTestReporter
  ) {
    if (!this.reporter)
      //@ts-ignore
      this.reporter = new reporterCtor(rootSuite)
    this.reporter['console'] = this.consoleSpy as unknown as Console
    await new TestRunner(rootSuite, this.reporter).run()
  }
}

export class TestReportForTests {
  constructor(public spy: ConsoleSpy) {}
  protected get calls(): ConsoleSpy['calls'] { return this.spy.calls }
  get lastLine(): string {return this.lines[this.lines.length - 1]}
  get lines(): string[] {
    return this.calls.args().map(args => args.join('\n'))
  }
  get full(): string {
    return this.calls.args().reduce((acc, arr) => acc = [...acc, ...arr], []).join('\n')
  }
}