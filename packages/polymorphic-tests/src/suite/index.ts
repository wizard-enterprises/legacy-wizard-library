import { TestEntityOpts, TestEntity, TestEntityType } from "../core/abstract-test-entity"
import { TestReporterDelegate } from "../core/test-reporter"

export interface SuiteOpts extends TestEntityOpts {
  rootSuite?: true
}

export class Suite extends TestEntity {
  public type = TestEntityType.suite
  public subTestEntities: TestEntity[] = []
  private _opts: SuiteOpts
  public get opts(): SuiteOpts { return this._opts }
  public set opts(opts: SuiteOpts) {
    this._opts = opts
    if (this.subTestEntities)
      this.applyOptsToSubEntities(this.subTestEntities)
  }
  protected updateForSkipBecauseOfOnly() {
    this.applyOptsToSubEntities(this.subTestEntities)
  }
  constructor(name, opts: SuiteOpts = {}) {
    super(name, opts)
  }

  addSubTestEntities(...testEntities: TestEntity[]) {
    this.subTestEntities = this.subTestEntities.concat(
      this.applyOptsToSubEntities(testEntities))
    return this
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
      entity.opts = entityOpts
    }
    return entities
  }

  private shouldApplySkipBecauseOfOnlyToSubEntity(entity, entityOpts) {
    return !entity.opts.only && entityOpts.skipBecauseOfOnly ||
      this.shouldSkipBecauseOfOnly && (!entityOpts.only || entityOpts.skip)
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    for (let testEntity of this.subTestEntities)
      await testEntity.run(reporter)
  }
}