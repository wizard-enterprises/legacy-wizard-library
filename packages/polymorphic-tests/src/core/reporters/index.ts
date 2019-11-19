import { SimpleTestReporter } from './simple'
import { TapReporter } from './tap'
import { MochaSpecReporter } from './mocha-spec'

export enum TestReporterType {
  simple = 'simple',
  raw = 'raw',
  tap = 'tap',
  mochaSpec = 'mochaSpec',
}

export function getReporterOfType(type: TestReporterType) {
  switch (type) {
    case TestReporterType.simple:
      return SimpleTestReporter
    case TestReporterType.tap:
      return TapReporter
    case TestReporterType.mochaSpec:
      return MochaSpecReporter
  }
}