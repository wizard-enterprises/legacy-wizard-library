import { BehaviorSubject, from, NEVER, Observable, of, Subject, race } from "rxjs"
import { delay, delayWhen, switchMap, switchMapTo, take } from 'rxjs/operators'
import { Suite } from "../suite"
import { TestReporterDelegate } from "./reporters/test-reporter"

export enum TestEntityStatus {
  pending = 'p',
  executing = 'e',
  passed = 'P',
  failed = 'F',
  skipped = 'S',
}

export enum TestEntityType {
  suite = 's',
  test = 't',
}

export interface TestEntityOpts {
  skip?: true,
  skipBecauseOfOnly?: boolean,
  only?: true,
  timeout?: number,
}

export class TestEntityIdStore {
  private static instance: TestEntityIdStore
  public static getInstance() {
    return this.instance || (this.instance = new this)
  }

  protected constructor() {}

  private ids: string[] = []
  private entities: TestEntity[] = []
  private idEntityMap: WeakMap<TestEntity, string> = new WeakMap

  public getIdForEntity(entity: TestEntity) {
    return this.idEntityMap.get(entity) || this.makeIdForEntity(entity)
  }

  private makeIdForEntity(entity: TestEntity) {
    let parentNameChain = this.getEntityParentNameChain(entity)
    let idWithoutAddedIndex, id = idWithoutAddedIndex = entity.type === TestEntityType.suite
      ? [...parentNameChain, entity.name].join('_')
      : `${parentNameChain.join('_')}: ${entity.name}`
    for (let i = 0; this.ids.includes(id); i++)
      id = [idWithoutAddedIndex, i].join('_')
    this.ids.push(id)
    this.entities.push(entity)
    this.idEntityMap.set(entity, id)
    return id
  }

  private getEntityParentNameChain(entity: TestEntity) {
    let parents = [],
      lastSuite = entity.parentSuite
    while (lastSuite && !lastSuite.opts.rootSuite) {
      parents.unshift(lastSuite.name)
      lastSuite = lastSuite.parentSuite
    }
    return parents
  }
}

class TimeoutError extends Error {}

export abstract class TestEntity<OptsType extends TestEntityOpts = TestEntityOpts> {
  public get id() { return this.idStore.getIdForEntity(this) }
  public abstract type: TestEntityType
  public parentSuite: Suite = null
  private _status: TestEntityStatus = TestEntityStatus.pending
  public get status() { return this._status }
  public start: Date
  public end: Date
  public reason?: Error

  private _testTimeout: number = 0
  public get testTimeout() { return this._testTimeout}
  public set testTimeout(testTimeout: number) {
    this._testTimeout = testTimeout
    if (this.testTimeoutSource) this.testTimeoutSource.next(testTimeout)
  }

  private _opts: OptsType
  public get opts(): OptsType { return this._opts }
  public set opts(opts: OptsType) {
    this._opts = opts
    this.gotNewOpts(opts)
  }
  protected gotNewOpts(opts: OptsType) {
    if (opts.timeout)
      this.testTimeout = opts.timeout
    this.start = new Date
  }

  private runStarted: Subject<void>
  private testTimeoutTerminator: Observable<TimeoutError>
  private testTimeoutSource: BehaviorSubject<number> = new BehaviorSubject(this.testTimeout)
    
  private _shouldSkipBecauseOfOnly = false
  protected get shouldSkipBecauseOfOnly() { return this._shouldSkipBecauseOfOnly }
  protected set shouldSkipBecauseOfOnly(shouldSkipBecauseOfOnly) {
    this._shouldSkipBecauseOfOnly = shouldSkipBecauseOfOnly
    this.updateForSkipBecauseOfOnly()
  }

  protected updateForSkipBecauseOfOnly() {}

  constructor(public name: string, opts: OptsType, protected idStore = TestEntityIdStore.getInstance()) {
    this.opts = opts
  }

  public run(reporter: TestReporterDelegate): Observable<void> {
    this.shouldSkipBecauseOfOnly = this.doesEntityHaveSubentitiesWithOnly(this) || !!this.opts.skipBecauseOfOnly
    if (this.shouldSkipEntity(this)) {
      if (this.type === TestEntityType.suite)
        return from(this.runTestEntity(reporter))
      reporter.testEntitySkipped(this)
      return of(null)
    }

    this.initializeTimeoutObservables()
    reporter.testEntityIsExecuting(this)
    this.start = new Date
    let p = (this.type === TestEntityType.suite
      ? this.runTestEntity(reporter)
      : race(from(this.runTestEntity(reporter)), this.testTimeoutTerminator).toPromise()
    ).then(r => {
      if (r instanceof Error) throw r
      this.end = new Date 
      reporter.testEntityPassed(this)
    }).catch(e => {
      this.end = new Date
      reporter.testEntityFailed(this, e)
    })
    this.runStarted.next(null)
    return from(p) as Observable<void>
  }

  protected initializeTimeoutObservables() {
    this.testTimeoutSource = new BehaviorSubject(this.testTimeout)
    this.runStarted = new Subject
    this.testTimeoutTerminator = of(null).pipe(
      take(1),
      delayWhen(() => this.runStarted),
      switchMapTo(this.testTimeoutSource),
      switchMap(timeout => {
        if (!timeout) return NEVER
        let timePassed = Date.now() - this.start.getTime(),
          remainingTime = timeout - timePassed
        if (remainingTime < 0) throw new TimeoutError(`Test "${this.name}" changed timeout to ${timeout}ms, but ${timePassed}ms passed.`)
        let timeoutErr = new TimeoutError(`Test "${this.name}" timed out at ${this.testTimeout}ms.`)
        return of(timeoutErr).pipe(delay(remainingTime))
      }),
      take(1),
    )
  }

  private doesEntityHaveSubentitiesWithOnly(entity: TestEntity) {
    if (entity.type === TestEntityType.test) return false
    let e: Suite = entity as unknown as Suite 
    return !!(e.subTestEntities.find(entity => entity.opts.only))
  }

  private shouldSkipEntity(entity: TestEntity) {
    return entity.type === TestEntityType.test && entity.opts.skip || entity.opts.skipBecauseOfOnly
  }

  protected failureReasonsOverride: Error[] = []

  protected abstract runTestEntity(reporter: TestReporterDelegate): Promise<void>

  public setStatus(status: TestEntityStatus) {
    this._status = status
  }
}
