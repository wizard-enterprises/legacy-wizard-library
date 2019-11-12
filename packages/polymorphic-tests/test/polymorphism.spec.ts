import { Suite, Test, TestSuite } from "../src/public-api";
import { decorateSubSuite, decorateSuite, decorateTest } from "../src/public-api/decorators";
import { RawTestRunnerSuite } from './test-runner-suite';
import { TestEntityStatus } from "../src/core/abstract-test-entity";

@Suite() class Polymorphism extends RawTestRunnerSuite {
  @Test() async 'instance should be cloned after setup for every test'(t) {
    @decorateSuite(t.config) class CloneInstancePerTest extends TestSuite {
      i: number
      setup() {
        this.i = 10
      }
      @decorateTest(t.config) 'test 1'(t) {
        this.i *= 2
        t.expect(this.i).to.equal(20)
      }
      @decorateTest(t.config) 'test 2'(t) {
        this.i *= 3
        t.expect(this.i).to.equal(30)
      }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('CloneInstancePerTest', {children: [
        this.testReport('CloneInstancePerTest: test 1'),
        this.testReport('CloneInstancePerTest: test 2'),
      ]}),
    ])
  }

  @Test() async 'should inherit tests from abstract test suite'(t) {
    abstract class AbstractSuite extends TestSuite {
      static counter = 1
      abstract expectedCounter: number
      after() {
        AbstractSuite.counter++
      }
      @decorateTest(t.config) 'counter should match subclass'(t) {
        t.expect(AbstractSuite.counter).to.equal(this.expectedCounter)
      }
    }
    @decorateSuite(t.config) class SomeSuite extends TestSuite {
      @decorateTest(t.config) 'first test'(t) { t.expect(true).to.equal(true) }
    }
    @decorateSubSuite(t.config, SomeSuite) class ChildOfAbstractSuite extends AbstractSuite {
      expectedCounter = 1
    }
    @decorateSuite(t.config) class SomeChildSuite extends AbstractSuite {
      expectedCounter = 2
    }
    @decorateSubSuite(t.config, SomeChildSuite) class SomeChildSubSuite extends AbstractSuite {
      expectedCounter = 3
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('SomeSuite', {children: [
        this.testReport('SomeSuite: first test'),
        this.suiteReport('SomeSuite_ChildOfAbstractSuite', {children: [
          this.testReport('SomeSuite_ChildOfAbstractSuite: counter should match subclass'),
        ]}),
      ]}),
      this.suiteReport('SomeChildSuite', {children: [
        this.testReport('SomeChildSuite: counter should match subclass'),
        this.suiteReport('SomeChildSuite_SomeChildSubSuite', {children: [
          this.testReport('SomeChildSuite_SomeChildSubSuite: counter should match subclass'),
        ]}),
      ]}),
    ])
  }

  @Test() async 'run inherited tests from abstract to specific'(t) {
    abstract class GrandparentSuite extends TestSuite {
      @decorateTest(t.config) 'grandparent test'(t) { t.expect(true).to.equal(true) }
    }
    abstract class ParentSuite extends GrandparentSuite {
      @decorateTest(t.config) 'parent test'(t) { t.expect(true).to.equal(true) }
    }
    @decorateSuite(t.config) class ChildSuite extends ParentSuite {
      @decorateTest(t.config) 'child test'(t) { t.expect(true).to.equal(true) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('ChildSuite', {children: [
        this.testReport('ChildSuite: grandparent test'),
        this.testReport('ChildSuite: parent test'),
        this.testReport('ChildSuite: child test'),
      ]}),
    ])
  }
  
  @Test() async 'allow before to modify test arg'(t) {
    @decorateSuite(t.config) class ModifyTestArg extends TestSuite {
      wasSet = false
      before(t) {
        super.before(t)
        t.doThing = () => this.wasSet = true
      }
      @decorateTest(t.config) 'should have modified test arg'(t) {
        t.expect(this.wasSet).to.equal(false)
        t.expect(t.doThing).to.be.a('function')
        t.doThing()
        t.expect(this.wasSet).to.equal(true)
      }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('ModifyTestArg', { children: [
        this.testReport('ModifyTestArg: should have modified test arg'),
      ]}),
    ])
  }

  @Test() async 'hooks and tests should be properly bound to instance clone'(t) {
    let beforeResult, testResult, afterResult
    @decorateSuite(t.config) class Binding extends TestSuite {
      beforeResult
      testResult
      afterResult
      before(t) {
        super.before(t)
        this.beforeResult = 1
      }
      @decorateTest(t.config) 'test'(t) {
        this.testResult = 5
      }
      after(t) {
        super.after(t)
        this.afterResult = 10
        ;[beforeResult, testResult, afterResult] = [this.beforeResult, this.testResult, this.afterResult]
      }
    }
    await this.runSuite()
    t.expect([beforeResult, testResult, afterResult])
      .to.deep.equal([1, 5, 10])
  }

  @Test() async 'ignore tests without only when inheriting tests with only'(t) {
    abstract class ParentSuite extends TestSuite {
      @decorateTest(t.config, {only: true}) 'should run from parent'(t) { t.expect(true).to.equal(true) }
      @decorateTest(t.config) 'should be skipped from parent'(t) { t.expect(true).to.equal(false) }
    }
    @decorateSuite(t.config) class ChildSuite extends ParentSuite {
      @decorateTest(t.config) 'should be skipped in child'(t) { t.expect(true).to.equal(false) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('ChildSuite', {children: [
        this.testReport('ChildSuite: should run from parent'),
        this.testReport('ChildSuite: should be skipped from parent', TestEntityStatus.skipped),
        this.testReport('ChildSuite: should be skipped in child', TestEntityStatus.skipped),
      ]}),
    ])
  }
}
