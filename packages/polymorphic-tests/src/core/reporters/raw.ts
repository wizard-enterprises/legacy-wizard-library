import { TestReporterType } from '.'
import { TestReporter } from './test-reporter'
import { Suite } from '../../suite'
import { TestEntityType, TestEntityStatus, TestEntity } from '../abstract-test-entity'

export class RawReporter extends TestReporter {
  type = TestReporterType.raw
  async end() {
    await super.end()
    this.console.log(JSON.stringify(this.makeEndReport()))
  }

  makeEndReport() {
    return this.parseTestEntity(this.entityCache.globalSuite).children
    // let passingTestsReport = `${this.passingTests.length}/${this.testMethods.length} passed`,
    //   runReport = this.failingTests.length
    //     ? `Run failed, ${this.failingTests.length} failed`
    //     : `Run successful`
    // return `${runReport}, ${passingTestsReport}.`
  }

  private parseTestEntity(entity: TestEntity) {
    let parsed = {
      id: entity.id,
      start: entity.start,
      end: entity.end,
      status: entity.status,
      type: entity.type,
    } as any
    if (entity instanceof Suite)
      parsed.children = entity.subTestEntities.map(e => this.parseTestEntity(e))
    return parsed as TestEntityReport
  }
}

interface TestEntityReport {
  id: string
  type: TestEntityType
  status: TestEntityStatus
  start: Date
  end: Date
  children?: TestEntityReport[]
}
