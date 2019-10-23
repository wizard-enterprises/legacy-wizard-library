import { TestEntityOpts } from '../src/core/abstract-test-entity'
import { Suite, Test, TestSuite } from '../src/public-api'
import { decorateSubSuite, decorateSuite, decorateTest } from '../src/public-api/decorators'
import { TestRunnerSuite } from './test-runner-suite'
import { TestReporterType } from '../src/core/reporters'

@Suite()
class SimpleFlows extends TestRunnerSuite {
  protected reporterType = TestReporterType.simple

  @Test() async 'report no tests'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class ExampleSuite extends TestSuite {}
    t.expect((await this.runSuiteAndGetReport()).lines).to.deep.equal(
      ['Running tests...', 'Run successful, 0/0 passed.'],
    )
  }
  
  @Test() async 'report one skipped test'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class ExampleSuite extends TestSuite {
      @decorateTest(config, {skip: true}) skip(t) { t.expect(false).to.equal(true) }
    }
    t.expect((await this.runSuiteAndGetReport()).lines).to.deep.equal(
      ['Running tests...', 'Run successful, 0/1 passed.'],
    )
  }

  @Test() async 'report one passing test'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class ExampleSuite extends TestSuite {
      @decorateTest(config) pass(t) { t.expect(true).to.equal(true) }
    }
    t.expect((await this.runSuiteAndGetReport()).lines).to.deep.equal(
      ['Running tests...', 'Run successful, 1/1 passed.'],
    )
  }
  
  @Test() async 'report failing suite'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class ExampleSuite extends TestSuite {
      @decorateTest(config) fail() { t.expect(false).to.equal(true) }
      @decorateTest(config) pass() { t.expect(true).to.equal(true) }
      @decorateTest(config, {skip: true}) skip() { t.expect(false).to.equal(true) }
    }
    let reportLines = (await this.runSuiteAndGetReport()).lines
    t.expect(reportLines[0]).to.equal('Running tests...')
    t.expect(reportLines[1]).to.include('Test "fail" failed:')
    t.expect(reportLines[1]).to.include('expected false to equal true')
    t.expect(reportLines[2]).to.equal('Run failed, 1 failed, 1/3 passed.')
  }
  
  @Test() async 'report with only and skip'(t) {
    let config = this.decoratorConfig,
      runCount = 0,
      passingTest = t => runCount++,
      skipOpts: TestEntityOpts = {skip: true},
      onlyOpts: TestEntityOpts = {only: true},
      skipAndOnlyOpts: TestEntityOpts = {only: true, skip: true}
    
    @decorateSuite(config, skipAndOnlyOpts) class ShouldBeSkipped1 extends TestSuite {
      @decorateTest(config) shouldSkip1(t) { t.expect(true).to.equal(false) }
      @decorateTest(config, onlyOpts) shouldSkip2(t) { t.expect(true).to.equal(false) }
    }
    @decorateSuite(config, skipOpts) class ShouldBeSkipped2 extends TestSuite {
      @decorateTest(config) shouldSkip3(t) { t.expect(true).to.equal(false) }
      @decorateTest(config, onlyOpts) shouldSkip4(t) { t.expect(true).to.equal(false) }
    }
    @decorateSuite(config) class ShouldNotRun1 extends TestSuite {
      @decorateTest(config) shouldNotRun(t) { t.expect(true).to.equal(false) }
      @decorateTest(config, onlyOpts) shouldRun(t) { passingTest(t) }
    }
    @decorateSuite(config, onlyOpts) class ShouldRun1 extends TestSuite {
      @decorateTest(config, skipOpts) shouldBeSkipped(t) { t.expect(true).to.equal(false) }
      @decorateTest(config) shouldRun(t) { passingTest(t) }
    }
    @decorateSubSuite(config, ShouldRun1) class ShouldRun2 extends TestSuite {
      @decorateTest(config, skipOpts) shouldBeSkipped(t) { t.expect(true).to.equal(false) }
      @decorateTest(config) shouldRun(t) { passingTest(t) }
    }
    @decorateSuite(config, onlyOpts) class ShouldRun3 extends TestSuite {
      @decorateTest(config, onlyOpts) shouldRun(t) { passingTest(t) }
      @decorateTest(config) shouldNotRun(t) { t.expect(true).to.equal(false) }
    }
    @decorateSubSuite(config, ShouldRun3) class ShouldNotRun3 extends TestSuite {
      @decorateTest(config) shouldNotRun(t) { t.expect(true).to.equal(false) }
    }
    let report = await this.runSuiteAndGetReport()
    t.expect(report.lastLine).to.equal('Run successful, 4/13 passed.', report.full)
    t.expect(runCount).to.equal(4)
  }

  @Test() async 'run polymorphic suite'(t) {
    let constructorCalledTimes = 0,
      setupCalledTimes = 0,
      beforeCalledTimes = 0,
      afterCalledTimes = 0,
      teardownCalledTimes = 0,
      waitMs = () => new Promise(resolve => setTimeout(resolve, 1)),
      config = this.decoratorConfig
    
    @decorateSuite(config)
    class ExampleSuite extends TestSuite {
      private counter = null
    
      constructor() {
        super()
        constructorCalledTimes++
        t.expect(this.counter).to.equal(null)
        this.counter = -1
      }
      
      async setup() {
        setupCalledTimes++
        await waitMs()
        if (setupCalledTimes > 1)
          throw new Error('setup should be called once, and whatever it does should be the starting point of before')
        t.expect(this.counter).to.equal(-1)
        this.counter = 2  
      }
      
      async before(t) {
        await waitMs()
        beforeCalledTimes++
        t.expect(this.counter).to.equal(2)
      }
      
      async after(t) {
        await waitMs()
        afterCalledTimes++
      }
      
      async teardown() {
        await waitMs()
        teardownCalledTimes++
      }
      
      @decorateTest(config) 'first test'(t) {
        this.counter *= 2
        t.expect(this.counter).to.equal(4)
      }
      
      @decorateTest(config) 'second test'(t) {
        this.counter *= 5
        t.expect(this.counter).to.equal(10)
      }
    
      @decorateTest(config) 'third test'(t) {
        t.expect(this.counter).to.equal(2)
      }
    }
    
    let report = await this.runSuiteAndGetReport()
    t.expect(report.lastLine).to.equal('Run successful, 3/3 passed.')
    t.expect(constructorCalledTimes).to.equal(1, 'Constructor should have been called once')
    t.expect(setupCalledTimes).to.equal(1, 'Setup should have been called once')
    t.expect(beforeCalledTimes).to.equal(3, 'Before should have been called thrice')
    t.expect(afterCalledTimes).to.equal(3, 'After should have been called thrice')
    t.expect(teardownCalledTimes).to.equal(1, 'Teardown should have been called once')
  }

  @Test() async 'inherit test'(t) {
    let config = this.decoratorConfig
    class UnregisteredGrandParentSuite extends TestSuite {
      @decorateTest(config) 'test in grandparent'(t) { t.expect(true).to.equal(true) }
    }
    @decorateSuite(config) class ParentSuite extends UnregisteredGrandParentSuite {
      @decorateTest(config) 'test in parent'(t) { t.expect(true).to.equal(true) }
    }
    @decorateSuite(config) class ChildSuite extends ParentSuite {
      @decorateTest(config) 'test in child'(t) { t.expect(true).to.equal(true) }
    }
    let report = await this.runSuiteAndGetReport()
    t.expect(report.lastLine).to.equal('Run successful, 5/5 passed.')
  }
}
