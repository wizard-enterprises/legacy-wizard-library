import { TestEntity, TestEntityStatus, TestEntityType } from "../abstract-test-entity"
import { Suite } from "../../suite"
import { TestMethod } from "../../test-method"
import { TestReporterType } from "."
import { GlobalSuite } from "../../suite/global"

export type TestReporterDelegate = {
  testEntityIsExecuting(entity: TestEntity): void
  testEntityPassed(entity: TestEntity): void
  testEntityFailed(entity: TestEntity, ...reasons: Error[]): void
  testEntitySkipped(entity: TestEntity): void
}

export abstract class TestReporter {
  protected entityCache = new TestReporterEntityCache
  protected console = console
  abstract type: TestReporterType

  public testMethods: TestMethod[] = []
  public get passingTests() { return this.getTestMethodsWithStatus(TestEntityStatus.passed) }
  public get failingTests() { return this.getTestMethodsWithStatus(TestEntityStatus.failed) }
  public get skippedTests() { return this.getTestMethodsWithStatus(TestEntityStatus.skipped) }
  private getTestMethodsWithStatus(status: TestEntityStatus) {
    return this.testMethods.filter(t => t.status === status)
  }
  
  public async start() {}
  public async end() {
    this.testMethods = this.entityCache.methods
  }

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
}

class TestReporterEntityCache {
  public entities: Map<string, TestEntity> = new Map
  public failureReasons: Map<string, Error[]> = new Map

  public get methods() {
    return this.getFilteredEntitiesByType<TestMethod>(TestEntityType.test)
  }

  public get suites() {
    return this.getFilteredEntitiesByType<Suite>(TestEntityType.suite)
  }

  public get globalSuite() {
    return this.suites.find(suite => suite instanceof GlobalSuite) as GlobalSuite
  }

  private getFilteredEntitiesByType<T extends TestEntity = TestEntity>(type: TestEntityType) {
    return [...this.entities.values()].filter(entity => entity.type === type) as T[]
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