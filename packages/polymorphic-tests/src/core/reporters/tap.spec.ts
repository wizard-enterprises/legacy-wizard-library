import { Suite, Test, TestSuite } from "../../public-api";
import { decorateSubSuite, decorateSuite, decorateTest } from "../../public-api/decorators";
import { RawTestRunnerSuite } from '../../../test/test-runner-suite';
import { TestReporterType } from ".";
import * as path from 'path'

@Suite() export class RawReporterSuite extends RawTestRunnerSuite {
  reporterType = TestReporterType.tap
  @Test() async 'empty suite'(t) {
    @decorateSuite(t.config) class EmptySuite extends TestSuite {}
    let report = (await this.runSuiteAndGetReport()).join('\n')
    t.expect(report).to.match(new RegExp(`\
TAP Version 13
ok 1 - EmptySuite # ${timeRegex} {
    1..0
}

1..1
# ${timeRegex}`))
  }
  
  @Test() async 'passing test'(t) {
    @decorateSuite(t.config) class PassingSuite extends TestSuite {
      @decorateTest(t.config) 'should pass'(t) {}
    }
    let report = (await this.runSuiteAndGetReport()).join('\n')
    t.expect(report).to.match(new RegExp(`\
TAP Version 13
ok 1 - PassingSuite # ${timeRegex} {
    ok 1 - should pass # ${timeRegex} {
        1..0
    }
    
    1..1
}

1..1
# ${timeRegex}`))
  }

  @Test() async 'skipping tests'(t) {
    @decorateSuite(t.config) class SuiteWithSkips extends TestSuite {
      @decorateTest(t.config, {only: true}) 'should run'(t) {}
      @decorateTest(t.config, {only: true, skip: true}) 'should be skipped'(t) { t.expect(true).to.equal(false) }
      @decorateTest(t.config) 'should also be skipped'(t) { t.expect(true).to.equal(false) }
    }
    let report = (await this.runSuiteAndGetReport()).join('\n')
    t.expect(report).to.match(new RegExp(`\
TAP Version 13
ok 1 - SuiteWithSkips # ${timeRegex} {
    ok 1 - should run # ${timeRegex} {
        1..0
    }
    
    ok 2 - should be skipped # SKIP
    ok 3 - should also be skipped # SKIP
    1..3
    # skip: 2
}

1..1
# ${timeRegex}`))
  }

  @Test() async 'failing test'(t) {
    let failureMessage = 'this is a test error',
      CustomError = function(message) {
        //@ts-ignore
        let _this = this
        Object.defineProperty(_this, 'message', {
            value : message || '',
            enumerable : false
        })
        Error.captureStackTrace(_this, CustomError)
      }
    CustomError.prototype = new Error()
    CustomError.prototype.name = "CustomError"

    @decorateSuite(t.config) class FailingSuite extends TestSuite {
      @decorateTest(t.config) 'should pass'(t) {}
      @decorateTest(t.config, {skip: true}) 'should be skipped'(t) { t.expect(true).to.equal(false) }
      @decorateTest(t.config) 'should fail'(t) { t.expect(
        {foo: 'bar', string: ['this is a string']}
      ).to.deep.equal(
        {foo: 'bar', string: ['this is a long string']}
      ) }
      @decorateTest(t.config) 'should also fail'(t) { throw new CustomError(failureMessage) }
    }
    let report = (await this.runSuiteAndGetReport()).join('\n')
    t.expect(report).to.match(new RegExp(`\
TAP Version 13
not ok 1 - FailingSuite # ${timeRegex}
  ---
  exitCode: 1
  ...
{
    ok 1 - should pass # ${timeRegex} {
        1..0
    }
${'    '}
    ok 2 - should be skipped # SKIP
    not ok 3 - should fail # ${timeRegex} {
        not ok 1 - expected { Object \\(foo, string\\) } to deeply equal { Object \\(foo, string\\) }
          ---
          found:
            foo: bar
            string:
              - this is a string
          wanted:
            foo: bar
            string:
              - this is a long string
          stack: \\|
            FailingSuite.should fail \\([^:]+:\\d+:\\d+\\)(?:\\n.+)*?
          at:
            line: \\d+
            column: \\d+
            file: .+
            function: "FailingSuite.should fail"
          tapCaught: AssertionError
          test: should fail
          \.\.\.
${'        '}
        1..1
        # failed 1 test
    }
${'    '}
    not ok 4 - should also fail # ${timeRegex} {
        not ok 1 - ${failureMessage}
          ---
          stack: \\|
            FailingSuite.should also fail \\([^:]+:\\d+:\\d+\\)(?:\\n.+)*?
          at:
            line: \\d+
            column: \\d+
            file: .+
            function: "FailingSuite.should also fail"
          tapCaught: CustomError
          test: should also fail
          \.\.\.
${'        '}
        1..1
        # failed 1 test
    }
${'    '}
    1..4
    # failed 2 of 4 tests
    # skip: 1
}
${''}
1..1
# failed 1 test
# ${timeRegex}`))
  }
}

const timeRegex = 'time=\\\d+ms'