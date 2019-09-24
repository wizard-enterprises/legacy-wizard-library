import { GlobalSuite } from "../src/suite/global"
import { DecoratorConfig } from "../src/public-api/decorators"
import { TestEntityRegistery } from "../src/core/test-registery"
import { GlobalSuiteForTests, DecoratorConfigForTests, ConsoleSpy } from "./mocks"
import { TestReporter } from "../src/core/reporters/test-reporter"
import { SimpleTestReporter } from "../src/core/reporters/simple"
import { TestRunner } from "../src/core/test-runner"
import { Suite as InternalSuite } from '../src/suite'
import { TestSuite } from "../src/public-api"

export class TestRunningSuite extends TestSuite {
  protected globalSuite: GlobalSuite
  protected decoratorConfig: DecoratorConfig
  protected registery: TestEntityRegistery

  before() {
    this.globalSuite = GlobalSuiteForTests.getNewInstance()
    this.decoratorConfig = DecoratorConfigForTests.getNewInstance()
    this.registery = new TestEntityRegistery(this.globalSuite)
    this.decoratorConfig.registery = this.registery
  }

  protected async getReportByRunningSuite(
    rootSuite: InternalSuite = this.globalSuite,
    reporterCtor: typeof TestReporter = SimpleTestReporter
  ) {
    let consoleSpy = new ConsoleSpy,
      //@ts-ignore
      reporter = new reporterCtor(rootSuite)
    reporter['console'] = consoleSpy as unknown as Console
    await new TestRunner(rootSuite, reporter).run()
    return new TestReportForTests(consoleSpy)
  }
}

class TestReportForTests {
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