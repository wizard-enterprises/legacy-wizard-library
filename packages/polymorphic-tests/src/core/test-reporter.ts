import { TestEntity, TestEntityStatus, TestEntityType } from "./abstract-test-entity"
import { Suite } from "../suite"

export type TestReporterDelegate = {
  testEntityIsExecuting(entity: TestEntity): void
  testEntityPassed(entity: TestEntity): void
  testEntityFailed(entity: TestEntity, ...reasons: Error[]): void
  testEntitySkipped(entity: TestEntity): void
}

export abstract class TestReporter {
  protected entityCache = new TestReporterEntityCache

  constructor(protected rootSuite: Suite) {}
  abstract async start()
  abstract async end()

  public getDelegate() { return this as unknown as TestReporterDelegate }
  
  protected testEntityIsExecuting(entity: TestEntity) {
    this.updateTestEntityStatus(entity, TestEntityStatus.executing)
  }

  protected testEntityPassed(entity: TestEntity) {
    this.updateTestEntityStatus(entity, TestEntityStatus.passed)
  }
  
  protected testEntityFailed(entity: TestEntity, ...reasons: Error[]) {
    this.updateTestEntityStatus(entity, TestEntityStatus.failed)
    this.entityCache.addFailureReasons(entity, ...reasons)
  }
  
  protected testEntitySkipped(entity: TestEntity) {
    this.updateTestEntityStatus(entity, TestEntityStatus.skipped)
  }
  
  private updateTestEntityStatus(entity: TestEntity, status: TestEntityStatus) {
    this.entityCache.syncTestEntityWithCache(entity).setStatus(status)
  }
  protected testEntityCache: Map<string, TestEntity> = new Map
  protected testEntityFailureReasons: Map<string, Error[]> = new Map
}

class TestReporterEntityCache {
  public entities: Map<string, TestEntity> = new Map
  public failureReasons: Map<string, Error[]> = new Map

  public get methods() {
    return this.getFilteredEntitiesByType(TestEntityType.test)
  }

  public get suites() {
    return this.getFilteredEntitiesByType(TestEntityType.suite)
  }

  private getFilteredEntitiesByType(type: TestEntityType) {
    return [...this.entities.values()].filter(entity => entity.type === type)
  }
  
  public syncTestEntityWithCache(entity: TestEntity) {
    if (this.shouldSaveEntityToCache(entity))
      this.entities.set(entity.id, entity)
    return entity
  }
  
  private shouldSaveEntityToCache(entity: TestEntity) {
    return !this.entities.get(entity.id) || (
      this.entities.get(entity.id) &&
      this.entities.get(entity.id) !== entity
    )
  }
  
  public addFailureReasons(entity: TestEntity, ...reasons: Error[]) {
    if (!this.failureReasons.get(entity.id))
      this.failureReasons.set(entity.id, reasons)
    else
      this.failureReasons.get(entity.id).concat(reasons)
  }
}