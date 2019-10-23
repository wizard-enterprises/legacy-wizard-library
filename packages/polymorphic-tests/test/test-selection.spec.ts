import { Suite, SubSuite, Test, TestSuite } from "../src/public-api"
import { RawTestRunnerSuite } from "./test-runner-suite"
import { decorateSuite, decorateTest, decorateSubSuite } from "../src/public-api/decorators"
import { TestEntityStatus as Status } from "../src/core/abstract-test-entity"

@Suite() class TestSelection extends RawTestRunnerSuite {}
@SubSuite(TestSelection) class Skip extends RawTestRunnerSuite {
  @Test() async 'skip test'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class SkipSuite extends TestSuite {
      @decorateTest(config) 'should run'(t) { makePassingExpectation(t) }
      @decorateTest(config, {skip: true}) 'should be skipped'(t) { makeFailingExpectation(t) }
      @decorateTest(config) 'should also run'(t) { makePassingExpectation(t) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('SkipSuite', {children: [
        this.testReport('SkipSuite: should run'),
        this.testReport('SkipSuite: should be skipped', Status.skipped),
        this.testReport('SkipSuite: should also run'),
      ]})
    ])
  }

  @Test() async 'skip suite'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class ShouldRunSuite extends TestSuite {
      @decorateTest(config) 'should run'(t) { makePassingExpectation(t) }
      @decorateTest(config, {skip: true}) 'should be skipped'(t) { makeFailingExpectation(t) }
    }
    @decorateSuite(config, {skip: true}) class ShouldBeSkippedSuite extends TestSuite {
      @decorateTest(config) 'should be skipped'(t) { makeFailingExpectation(t) }
      @decorateTest(config, {skip: true}) 'should also be skipped'(t) { makeFailingExpectation(t) }
    }
    @decorateSuite(config) class ShouldAlsoRunSuite extends TestSuite {
      @decorateTest(config) 'should run'(t) { makePassingExpectation(t) }
      @decorateTest(config, {skip: true}) 'should be skipped'(t) { makeFailingExpectation(t) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('ShouldRunSuite', {children: [
        this.testReport('ShouldRunSuite: should run'),
        this.testReport('ShouldRunSuite: should be skipped', Status.skipped),
      ]}),
      this.suiteReport('ShouldBeSkippedSuite', {children: [
        this.testReport('ShouldBeSkippedSuite: should be skipped', Status.skipped),
        this.testReport('ShouldBeSkippedSuite: should also be skipped', Status.skipped),
      ]}),
      this.suiteReport('ShouldAlsoRunSuite', {children: [
        this.testReport('ShouldAlsoRunSuite: should run'),
        this.testReport('ShouldAlsoRunSuite: should be skipped', Status.skipped),
      ]}),
    ])
  }
}

@SubSuite(TestSelection) class Only extends RawTestRunnerSuite {
  @Test() async 'run only test'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class PlainSuite extends TestSuite {
      @decorateTest(config) 'should not run'(t) { makeFailingExpectation(t) }
      @decorateTest(config, {only: true}) 'should run'(t) { makePassingExpectation(t) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('PlainSuite', {children: [
        this.testReport('PlainSuite: should not run', Status.skipped),
        this.testReport('PlainSuite: should run'),
      ]}),
    ])
  }

  @Test() async 'run only suite'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config, {only: true}) class SuiteWithOnly extends TestSuite {
      @decorateTest(config) 'should run'(t) { makePassingExpectation(t) }
    }
    @decorateSuite(config) class PlainSuite extends TestSuite {
      @decorateTest(config) 'should not run'(t) { makeFailingExpectation(t) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('SuiteWithOnly', {children: [
        this.testReport('SuiteWithOnly: should run'),
      ]}),
      this.suiteReport('PlainSuite', {children: [
        this.testReport('PlainSuite: should not run', Status.skipped),
      ]}),
    ])
  }

  @Test() async 'apply only exclusively inside one test entity level'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class PlainSuite extends TestSuite {
      @decorateTest(config) 'should not run'(t) { makeFailingExpectation(t) }
    }
    @decorateSuite(config, {only: true}) class SuiteWithOnly extends TestSuite {
      @decorateTest(config) 'should run'(t) { makePassingExpectation(t) }
    }
    @decorateSubSuite(config, SuiteWithOnly) class PlainSuiteInOnly extends TestSuite {
      @decorateTest(config) 'should not run because of subsuite with only'(t) { makeFailingExpectation(t) }
    }
    @decorateSubSuite(config, PlainSuiteInOnly) class SubSuiteWithoutOnly extends TestSuite {
      @decorateTest(config) 'should not run because of subsuite with only'(t) { makeFailingExpectation(t) }
    }
    @decorateSubSuite(config, PlainSuiteInOnly, {only: true}) class SubSuiteWithOnly extends TestSuite {
      @decorateTest(config) 'should run'(t) { makePassingExpectation(t) }
    }
    let onlyId = 'SuiteWithOnly',
      plainInOnlyId = `${onlyId}_PlainSuiteInOnly`
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('PlainSuite', {children: [
        this.testReport('PlainSuite: should not run', Status.skipped),
      ]}),
      this.suiteReport(onlyId, {children: [
        this.testReport(`${onlyId}: should run`),
        this.suiteReport(plainInOnlyId, {children: [
          this.testReport(`${plainInOnlyId}: should not run because of subsuite with only`, Status.skipped),
          this.suiteReport(`${plainInOnlyId}_SubSuiteWithoutOnly`, {children: [
            this.testReport(`${plainInOnlyId}_SubSuiteWithoutOnly: should not run because of subsuite with only`, Status.skipped),
          ]}),
          this.suiteReport(`${plainInOnlyId}_SubSuiteWithOnly`, {children: [
            this.testReport(`${plainInOnlyId}_SubSuiteWithOnly: should run`)
          ]}),
        ]}),
      ]}),
    ])
  }
}

@SubSuite(TestSelection) class SkipAndOnly extends RawTestRunnerSuite {
  @Test() async 'skip should take precedence over only on test'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class SkipOverOnly extends TestSuite {
      @decorateTest(config, {only: true, skip: true}) 'only and skip should not run'(t) { makeFailingExpectation(t) }
      @decorateTest(config) 'should not run because of only'(t) { makeFailingExpectation(t) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('SkipOverOnly', {children: [
        this.testReport('SkipOverOnly: only and skip should not run', Status.skipped),
        this.testReport('SkipOverOnly: should not run because of only', Status.skipped),
      ]}),
    ])
  }

  @Test() async 'skipped suite should not run subentities with only'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class ShouldRun extends TestSuite{
      @decorateTest(config, {only: true}) 'should run'(t) { makePassingExpectation(t) }
    }
    @decorateSuite(config, {skip: true}) class SkipOverOnly extends TestSuite {
      @decorateTest(config, {only: true}) 'should not run because of skip'(t) { makeFailingExpectation(t) }
      @decorateTest(config) 'should also not run'(t) { makeFailingExpectation(t) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('ShouldRun', {children: [
        this.testReport('ShouldRun: should run'),
      ]}),
      this.suiteReport('SkipOverOnly', {children: [
        this.testReport('SkipOverOnly: should not run because of skip', Status.skipped),
        this.testReport('SkipOverOnly: should also not run', Status.skipped),
      ]}),
    ])
  }
}

function makePassingExpectation (t) {
  t.expect(true).to.equal(true)
}
function makeFailingExpectation (t) {
  t.expect(true).to.equal(false)
}