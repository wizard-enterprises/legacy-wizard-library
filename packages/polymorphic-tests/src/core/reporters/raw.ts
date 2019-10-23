import { TestReporterType } from '.'
import { SummaryTestReporter } from './test-reporter'
import { Suite } from '../../suite'
import { TestEntityType, TestEntityStatus, TestEntity } from '../abstract-test-entity'

export class RawReporter<ReportT = TestEntityReport[]> extends SummaryTestReporter {
  type = TestReporterType.raw
  async end() {
    await super.end()
    if (this.constructor === RawReporter)
      this.console.log(JSON.stringify(this.makeEndReport()))
  }

  makeEndReport() {
    return this.parseTestEntity(this.entityCache.globalSuite).children as unknown as ReportT
  }

  private parseTestEntity(entity: TestEntity) {
    let parsed = {
      id: entity.id,
      name: entity.name,
      start: entity.start,
      end: entity.end,
      status: entity.status,
      type: entity.type,
      reason: entity.reason,
    } as any
    if (entity instanceof Suite)
      parsed.children = entity.subTestEntities.map(e => this.parseTestEntity(e))
    return parsed as TestEntityReport
  }
}

export interface TestEntityReport {
  id: string
  name: string
  type: TestEntityType
  status: TestEntityStatus
  start: Date
  end: Date
  reason?: Error
  children?: TestEntityReport[]
}
