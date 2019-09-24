import { TestEntityOpts } from '../src/core/abstract-test-entity'
import { assert } from '../src/core/assert'
import { Suite, Test, TestSuite } from '../src/public-api'
import { decorateSubSuite, decorateSuite, decorateTest } from '../src/public-api/decorators'
import { TestRunningSuite } from './test-running-suite'

@Suite()
class SimpleFlows extends TestRunningSuite {
  @Test() async 'report no tests'() {
    let config = this.decoratorConfig
    @decorateSuite({}, config) class ExampleSuite extends TestSuite {}
    assert.primitiveEqual(
      (await this.getReportByRunningSuite()).lines,
      ['Running tests...', 'Run successful, 0/0 passed.'],
    )
  }
  
  @Test() async 'report one skipped test'() {
    let config = this.decoratorConfig
    @decorateSuite({}, config) class ExampleSuite extends TestSuite {
      @decorateTest({skip: true}, config) skip() { assert(false) }
    }
    assert.primitiveEqual(
      (await this.getReportByRunningSuite()).lines,
      ['Running tests...', 'Run successful, 0/1 passed.'],
    )
  }

  @Test() async 'report one passing test'() {
    let config = this.decoratorConfig
    @decorateSuite({}, config) class ExampleSuite extends TestSuite {
      @decorateTest({}, config) pass() { assert(true) }
    }
    assert.primitiveEqual(
      (await this.getReportByRunningSuite()).lines,
      ['Running tests...', 'Run successful, 1/1 passed.'],
    )
  }
  
  @Test() async 'report failing suite'() {
    let config = this.decoratorConfig
    @decorateSuite({}, config) class ExampleSuite extends TestSuite {
      @decorateTest({}, config) pass() { assert(true) }
      @decorateTest({skip: true}, config) skip() { assert(false) }
      @decorateTest({}, config) fail() { assert(false) }
    }
    let reportLines = (await this.getReportByRunningSuite()).lines
    assert.identical(reportLines[0], 'Running tests...')
    assert.includes(reportLines[1], 'Test "fail" failed:')
    assert.includes(reportLines[1], 'Expected "false" to be truthy')
    assert.identical(reportLines[2], 'Run failed, 1 failed, 1/3 passed.')
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
    let report = await this.getReportByRunningSuite()
    assert.identical(report.lastLine, 'Run successful, 4/13 passed.', report.full)
    assert.identical(runCount, 4)
  }

  @Test() async 'run polymorphic suite'() {
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
        assert.identical(this.counter, null)
        this.counter = -1
      }
      
      async setup() {
        setupCalledTimes++
        await waitMs()
        if (setupCalledTimes > 1)
          throw new Error('setup should be called once, and whatever it does should be the starting point of before')
        assert.identical(this.counter, -1)
        this.counter = 2  
      }
      
      async before() {
        await waitMs()
        beforeCalledTimes++
        assert.identical(this.counter, 2)
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
        assert.identical(this.counter, 4)
      }
      
      @decorateTest({}, config) 'second test'() {
        this.counter *= 5
        assert.identical(this.counter, 10)
      }
    
      @decorateTest({}, config) 'third test'() {
        assert.identical(this.counter, 2)
      }
    }
    
    let report = await this.getReportByRunningSuite()
    assert.identical(report.lastLine, 'Run successful, 3/3 passed.')
    assert.identical(constructorCalledTimes, 1, 'Constructor should have been called once')
    assert.identical(setupCalledTimes, 1, 'Setup should have been called once')
    assert.identical(beforeCalledTimes, 3, 'Before should have been called thrice')
    assert.identical(afterCalledTimes, 3, 'After should have been called thrice')
    assert.identical(teardownCalledTimes, 1, 'Teardown should have been called once')
  }

  @Test() async 'inherit test'() {
    let config = this.decoratorConfig
    class UnregisteredGrandParentSuite extends TestSuite {
      @decorateTest({}, config) 'test in grandparent'() { assert(true) }
    }
    @decorateSuite({}, config) class ParentSuite extends UnregisteredGrandParentSuite {
      @decorateTest({}, config) 'test in parent'() { assert(true) }
    }
    @decorateSuite({}, config) class ChildSuite extends ParentSuite {
      @decorateTest({}, config) 'test in child'() { assert(true) }
    }
    let report = await this.getReportByRunningSuite()
    assert.primitiveEqual(report.lastLine, 'Run successful, 5/5 passed.')
  }
}
