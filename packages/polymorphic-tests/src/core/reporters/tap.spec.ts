import { ReporterTestSuite } from "./reporter.spec";
import { TestReporterType } from "."
import { Suite, Test } from "../../public-api";
import { TestReportForTests } from "../../../test/test-running-suite";
import { TapReporter } from "./tap";

// @Suite() class TapReporterSuite extends ReporterTestSuite {
//   protected type = TestReporterType.tap
//   protected reporter: TapReporter

//   protected validateBasicSuiteReport(t, report: TestReportForTests) {
//     t.assert.deepEqual(
//       report.spy.calls.args(),
//       [[
//         'TAP version 13',
//         '1..1',
//         '# Subtest: ExampleSuite',
//         '    1..4',
//         '    ok 1 - skip # SKIP',
//         '    ok 2 - skipBecauseNotOnly # SKIP',
//         '    not ok 3 - fail',
//         '    ok 4 - pass',
//         `ok 1 - ExampleSuite # time=0ms`,
//         `# time=0ms`,
//       ]])
//   }
// }
