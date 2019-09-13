import {ConsoleSpy} from './mocks/console.mock'
import {Suite, Test, TestSuite} from '../src/public-api'
import {decorateSuite, decorateSubSuite, decorateTest, DecoratorConfig} from '../src/public-api/decorators' 
import {GlobalSuiteForTests, DecoratorConfigForTests} from './mocks'
import {assert, assertIdentical, assertIncludes, assertPrimitiveEqual} from '../src/core/assert'
import {GlobalSuite} from '../src/suite/global'
import {Suite as InternalSuite} from '../src/suite'
import {TestEntityRegistery} from '../src/public-api/test-registery'
import {TestEntityOpts} from '../src/core/abstract-test-entity'
import {TestRunner} from '../src/core/test-runner'
import {SimpleTestReporter} from '../src/core/reporters/simple'

@Suite()
class SimpleFlows extends TestSuite {
  private globalSuite: GlobalSuite
  private decoratorConfig: DecoratorConfig
  private registery: TestEntityRegistery
  before() {
    this.globalSuite = GlobalSuiteForTests.getNewInstance()
    this.decoratorConfig = DecoratorConfigForTests.getNewInstance()
    this.registery = new TestEntityRegistery(this.globalSuite)
    this.decoratorConfig.registery = this.registery
  }

  @Test() async 'report no tests'() {
    let config = this.decoratorConfig
    @decorateSuite({}, config) class ExampleSuite extends TestSuite {}
    assertPrimitiveEqual(
      (await this.getConsoleCallsFromRunningSuite())
        .args().map(args => args[0]),
      ['Running tests...', 'Run successful, 0/0 passed.'],
    )
  }
  
  @Test() async 'report one skipped test'() {
    let config = this.decoratorConfig
    @decorateSuite({}, config) class ExampleSuite extends TestSuite {
      @decorateTest({skip: true}, config) skip() { assert(false) }
    }
    assertPrimitiveEqual(
      (await this.getConsoleCallsFromRunningSuite())
        .args().map(args => args[0]),
      ['Running tests...', 'Run successful, 0/1 passed.'],
    )
  }

  @Test() async 'report one passing test'() {
    let config = this.decoratorConfig
    @decorateSuite({}, config) class ExampleSuite extends TestSuite {
      @decorateTest({}, config) pass() { assert(true) }
    }
  }
  
  @Test() async 'report failing suite'() {
    let config = this.decoratorConfig
    @decorateSuite({}, config) class ExampleSuite extends TestSuite {
      @decorateTest({}, config) pass() { assert(true) }
      @decorateTest({skip: true}, config) skip() { assert(false) }
      @decorateTest({}, config) fail() { assert(false) }
    }
    let callArgs = (await this.getConsoleCallsFromRunningSuite()).args()
    assertIdentical(callArgs[0][0], 'Running tests...')
    assertIncludes(callArgs[1].join('\n'), 'Test "fail" failed:')
    assertIncludes(callArgs[1].join('\n'), 'Expected "false" to be truthy')
    assertIdentical(callArgs[2][0], 'Run failed, 1 failed, 1/3 passed.')
  }
  
  @Test() async 'report with only and skip'() {
    let config = this.decoratorConfig,
      runCount = 0,
      passingTest = () => runCount++,
      skipOpts: TestEntityOpts = {skip: true},
      onlyOpts: TestEntityOpts = {only: true},
      skipAndOnlyOpts: TestEntityOpts = {only: true, skip: true}
    
    @decorateSuite(skipAndOnlyOpts, config) class ShouldBeSkipped1 extends TestSuite {
      @decorateTest({}, config) shouldSkip1() { assert(false) }
      @decorateTest(onlyOpts, config) shouldSkip2() { assert(false) }
    }
    @decorateSuite(skipOpts, config) class ShouldBeSkipped2 extends TestSuite {
      @decorateTest({}, config) shouldSkip3() { assert(false) }
      @decorateTest(onlyOpts, config) shouldSkip4() { assert(false) }
    }
    @decorateSuite({}, config) class ShouldNotRun1 extends TestSuite {
      @decorateTest({}, config) shouldNotRun() { assert(false) }
      @decorateTest(onlyOpts, config) shouldRun() { passingTest() }
    }
    @decorateSuite(onlyOpts, config) class ShouldRun1 extends TestSuite {
      @decorateTest(skipOpts, config) shouldBeSkipped() { assert(false) }
      @decorateTest({}, config) shouldRun() { passingTest() }
    }
    @decorateSubSuite(ShouldRun1, {}, config) class ShouldRun2 extends TestSuite {
      @decorateTest(skipOpts, config) shouldBeSkipped() { assert(false) }
      @decorateTest({}, config) shouldRun() { passingTest() }
    }
    @decorateSuite(onlyOpts, config) class ShouldRun3 extends TestSuite {
      @decorateTest(onlyOpts, config) shouldRun() { passingTest() }
      @decorateTest({}, config) shouldNotRun() { assert(false) }
    }
    @decorateSubSuite(ShouldRun3, {}, config) class ShouldNotRun3 extends TestSuite {
      @decorateTest({}, config) shouldNotRun() { assert(false) }
    }
    let calls = await this.getConsoleCallsFromRunningSuite()
    assertIdentical(calls.args()[calls.args().length - 1][0], 'Run successful, 4/13 passed.', calls.args().join('\n'))
    assertIdentical(runCount, 4)
  }

  @Test() async 'register test class with decorators'() {
    let constructorCalledTimes = 0,
      setupCalledTimes = 0,
      beforeCalledTimes = 0,
      afterCalledTimes = 0,
      teardownCalledTimes = 0,
      waitMs = () => new Promise(resolve => setTimeout(resolve, 1)),
      config = this.decoratorConfig
    
    @decorateSuite({}, config)
    class ExampleSuite extends TestSuite {
      private counter = null
    
      constructor() {
        super()
        constructorCalledTimes++
        assertIdentical(this.counter, null)
        this.counter = -1
      }
      
      async setup() {
        setupCalledTimes++
        await waitMs()
        if (setupCalledTimes > 1)
          throw new Error('setup should be called once, and whatever it does should be the starting point of before')
        assertIdentical(this.counter, -1)
        this.counter = 2  
      }
      
      async before() {
        await waitMs()
        beforeCalledTimes++
        assertIdentical(this.counter, 2)
      }
      
      async after() {
        await waitMs()
        afterCalledTimes++
      }
      
      async teardown() {
        await waitMs()
        teardownCalledTimes++
      }
      
      @decorateTest({}, config) 'first test'() {
        this.counter *= 2
        assertIdentical(this.counter, 4)
      }
      
      @decorateTest({}, config) 'second test'() {
        this.counter *= 5
        assertIdentical(this.counter, 10)
      }
    
      @decorateTest({}, config) 'third test'() {
        assertIdentical(this.counter, 2)
      }
    }
    
    let calls = await this.getConsoleCallsFromRunningSuite()
    assertIdentical(calls.args()[calls().length - 1][0], 'Run successful, 3/3 passed.')
    assertIdentical(constructorCalledTimes, 1, 'Constructor should have been called once')
    assertIdentical(setupCalledTimes, 1, 'Setup should have been called once')
    assertIdentical(beforeCalledTimes, 3, 'Before should have been called thrice')
    assertIdentical(afterCalledTimes, 3, 'After should have been called thrice')
    assertIdentical(teardownCalledTimes, 1, 'Teardown should have been called once')
  }

  private async getConsoleCallsFromRunningSuite(rootSuite: InternalSuite = this.globalSuite) {
    let consoleSpy = new ConsoleSpy,
      reporter = new SimpleTestReporter(rootSuite, consoleSpy)
    await new TestRunner(rootSuite, reporter).run()
    return consoleSpy.calls
  }
}
    
let global = GlobalSuite.getInstance()
new TestRunner(global, new SimpleTestReporter(global)).run()