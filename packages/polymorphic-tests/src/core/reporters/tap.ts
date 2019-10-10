import { isNull } from "util"
import { TestReporterType } from "."
import { TestEntityStatus, TestEntityType as _TestEntityType } from "../abstract-test-entity"
import { RawReporter, TestEntityReport } from "./raw"
import * as YAML from 'yaml'

enum NewTestEntityType {
  errorSubtest = 'ES'
}

const TestEntityType = {..._TestEntityType, ...NewTestEntityType}

export class TapReporter extends RawReporter<string[]> {
  type = TestReporterType.tap
  indentationUnit = '    '
  rootChildren: TestEntityReport[]

  async end() {
    await super.end()
    for (let line of this.makeEndReport())
      this.console.log(line)
  }

  makeEndReport() {
    let raw = super.makeEndReport() as unknown as TestEntityReport[],
      global = this.entityCache.globalSuite
    this.rootChildren = raw
    return [
      'TAP Version 13',
      ...this.makeSuiteChildrenReportLines(this.rootChildren),
      `# time=${global.end.getTime() - global.start.getTime()}ms`,
    ]
  }

  private makeSuiteChildrenReportLines(suiteChildren, indentation = '') {
    let children = this.getSortedSuiteChildren(suiteChildren)
    //@ts-ignore
    let lines = [
      ...children.reduce((acc, entity, index) =>
        [...acc, ...this.makeSuiteReportLines(entity, index + 1, indentation)]
      , []),
      `${indentation}1..${children.length}`,
    ]
    let failedEntityCount = children.filter(test => test.status === TestEntityStatus.failed).length,
      skippedTestCount = children.filter(test => test.status === TestEntityStatus.skipped).length
    if (failedEntityCount)
      lines.push(indentation + this.makeFailureSummaryLine(children, failedEntityCount))
    if (skippedTestCount) lines.push(indentation + `# skip: ${skippedTestCount}`)
    return lines
  }

  private getSortedSuiteChildren(suiteChildren) {
    if (!suiteChildren) suiteChildren = []
    let children = [
      ...suiteChildren.filter(child => child.type === TestEntityType.test),
      ...suiteChildren.filter(child => child.type === TestEntityType.suite)
    ]
    return children.length > 0 ? children : suiteChildren || []
  }

  private makeFailureSummaryLine(children, failedCount: number) {
    let start = `# failed ${failedCount} `,
      end = failedCount === children.length
        ? children.length > 1 ? 'tests' : 'test'
        : `of ${children.length} tests`
    return start + end
  }

  private makeSuiteReportLines(entity: TestEntityReport, index: number, indentation = '') {
    if (entity.status === TestEntityStatus.skipped)
      return [indentation + this.makeEntityLine(entity, index)]
    let lines: string[] = []
    if (entity.status === TestEntityStatus.failed && entity.type === TestEntityType.test)
      entity = this.addErrorSubtestToFailingTest(entity)
    //@ts-ignore
    let entityContent = entity.type === TestEntityType.errorSubtest
      ? this.makeErrorDiagnosticLines(entity, indentation + '  ')
      : this.makeSuiteChildrenReportLines(entity.children, indentation + this.indentationUnit)

    return [...lines, ...this.makeComplexEntityReportLines(
      entity, index, indentation, entityContent,
    )]
  }

  private makeComplexEntityReportLines(entity: TestEntityReport, index: number, indentation: string, content: string[]) {
    //@ts-ignore
    let shouldWrapInBraces = entity.type !== TestEntityType.errorSubtest,
      firstLine = this.makeEntityLine(entity, index)
    if (this.isFailingRootSuite(entity))
      content = [...`\
---
exitCode: 1
...`.split('\n').map(s => indentation + '  ' + s), indentation + '{', ...content]
    else if (shouldWrapInBraces) firstLine += ' {'
    return [
      indentation + firstLine,
      ...content,
      shouldWrapInBraces ? indentation + '}' : null,
      indentation,
    ].filter(x => !isNull(x))
  }

  private makeEntityLine(entity: TestEntityReport, index: number) {
    let base = `${this.getEntityStatus(entity)} ${index} - ${entity.name}`
    //@ts-ignore
    if (entity.type === TestEntityType.errorSubtest) return base
    return entity.status === TestEntityStatus.skipped
      ? `${base} # SKIP`
      : `${base} # time=${this.makeDuration(entity)}ms`
  }

  private getEntityStatus(entity: TestEntityReport) {
    let isOk = entity.status !== TestEntityStatus.failed
    return isOk ? 'ok' : 'not ok'
  }

  private makeDuration(entity: TestEntityReport) {
    return entity.end.getTime() - entity.start.getTime()
  }
  
  private addErrorSubtestToFailingTest(test: TestEntityReport) {
    let testWithError = {...test, type: TestEntityType.suite, children: [{
      id: null,
      name: test.reason.message,
      type: TestEntityType.errorSubtest,
      status: TestEntityStatus.failed,
      reason: test.reason,
    }]} as unknown as TestEntityReport
    delete testWithError.reason
    return testWithError
  }

  private isFailingRootSuite(entity) {
    return entity.type === TestEntityType.suite &&
      this.rootChildren.includes(entity) &&
      entity.status === TestEntityStatus.failed
  }

  private makeErrorDiagnosticLines(entity: TestEntityReport, indentation: string) {
    //@ts-ignore
    if (!(entity.status === TestEntityStatus.failed && entity.type === TestEntityType.errorSubtest)) return []
    let {
      yamlStack, stackStartFile, stackStartLine, stackStartColumn, stackStartFunction
    } = this.parseErrorForYaml(entity)
    return [...`\
---
${[
  entity.reason['actual'] ? YAML.stringify({found: entity.reason['actual']}).trim() : null,
  entity.reason['expected'] ? YAML.stringify({wanted: entity.reason['expected']}).trim() : null,
].filter(x => !isNull(x)).map(s => s + '\n').join('')}stack: |
${yamlStack}
at:
  line: ${stackStartLine}
  column: ${stackStartColumn}
  file: ${stackStartFile}
  function: "${stackStartFunction}"
tapCaught: ${entity.reason.name}
test: ${stackStartFunction.split('.')[1]}
...`.split('\n').map(s => indentation + s)//, indentation
    ]
  }

  private parseErrorForYaml(entity) {
    let yamlStack = entity.reason.stack
      .substr(entity.reason.stack.indexOf('\n'))
      .replace(/at /g, '')
      .replace(/\n\s+/g, '\n  ')
      .substr(1)
    let firstLineOfStack, locationOfFirstLineOfStack
    try {
      firstLineOfStack = yamlStack.substr(0, yamlStack.indexOf('\n'))
      locationOfFirstLineOfStack = /\((.+)\)\s*$/.exec(firstLineOfStack)[1]
    } catch (e) {
      this.console.error('could not parse stack of error', entity.name)
      throw entity.reason
    }
    let [stackStartFile, stackStartLine, stackStartColumn] = locationOfFirstLineOfStack.split(':'),
      stackStartFunction = firstLineOfStack
        .replace(locationOfFirstLineOfStack, '')
        .replace(/\s*$/, '')
        .replace('()', '')
        .trim()
    
    return {yamlStack, stackStartFile, stackStartLine, stackStartColumn, stackStartFunction}
  }
}