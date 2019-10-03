import { from } from "rxjs"
import { TestEntity, TestEntityIdStore, TestEntityOpts, TestEntityType, TestEntityStatus } from "../core/abstract-test-entity"
import { TestReporterDelegate } from "../core/reporters/test-reporter"
import { tap } from "rxjs/operators"

export interface SuiteOpts extends TestEntityOpts {
  rootSuite?: true
}

export class Suite extends TestEntity<SuiteOpts> {
  public type = TestEntityType.suite
  public subTestEntities: TestEntity[] = []
  protected updateForSkipBecauseOfOnly() {
    this.applyOptsToSubEntities(this.subTestEntities)
  }
  constructor(name, opts: SuiteOpts = {}, idStore = TestEntityIdStore.getInstance()) {
    super(name, opts, idStore)
  }

  addSubTestEntities(...testEntities: TestEntity[]) {
    this.subTestEntities = this.subTestEntities.concat(
      this.applyOptsToSubEntities(testEntities))
    return this
  }
  
  protected gotNewOpts(opts: SuiteOpts) {
    super.gotNewOpts(opts)
    if (this.subTestEntities)
      this.applyOptsToSubEntities(this.subTestEntities, opts)
  }
  
  private applyOptsToSubEntities(entities: TestEntity[], opts: SuiteOpts = this.opts) {
    for (let entity of entities) {
      entity.parentSuite = this
      opts = {...opts}
      delete opts.rootSuite
      delete opts.only 
      let entityOpts = {
        ...entity.opts,
        skipBecauseOfOnly: this.shouldApplySkipBecauseOfOnlyToSubEntity(
          entity, {...entity.opts, ...opts},
        ),
      }
      if (!entityOpts.timeout)
        entityOpts.timeout = this.testTimeout
      entity.opts = entityOpts
    }
    return entities
  }

  private shouldApplySkipBecauseOfOnlyToSubEntity(entity, entityOpts) {
    return !entity.opts.only && entityOpts.skipBecauseOfOnly ||
      this.shouldSkipBecauseOfOnly && (!entityOpts.only || entityOpts.skip)
  }

  run(reporter: TestReporterDelegate) {
    return super.run(reporter).pipe(
      tap(() => {
        if (this.subTestEntities.find(e => e.status === TestEntityStatus.failed))
          reporter.testEntityFailed(this)
      })
    )
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    for (let e of this.subTestEntities)
      await e.run(reporter).toPromise()
  }
}