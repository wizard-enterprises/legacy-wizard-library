import { Suite, SuiteOpts } from "../suite"
import { TestMethodOpts } from "../test-method"
import { TestReporterDelegate } from "./reporters/test-reporter"
import { Observable, of, BehaviorSubject, Subject, timer, race, never, combineLatest, throwError,  } from "rxjs"
import { tap, catchError, skipUntil, switchMap, take, mapTo, delay, delayWhen, startWith, last, switchMapTo,  } from 'rxjs/operators'

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
    let unnumberedId, id = unnumberedId = entity.type === TestEntityType.suite
      ? [...parentNameChain, entity.name].join('_')
      : `${parentNameChain.join('_')}: ${entity.name}`
    for (let i = 0; this.ids.includes(id); i++)
      id = [unnumberedId, i].join('_')
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
  public get status() { return this._status}
  public start: Date
  public end: Date
  public reason?: Error
  private _testTimeout: number = 0
  public get testTimeout() { return this._testTimeout}
  public set testTimeout(testTimeout: number) {
    this._testTimeout = testTimeout
    console.log('set timeout', this.name, testTimeout)
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
      reporter.testEntitySkipped(this)
      return this.type === TestEntityType.suite ? this.runTestEntity(reporter) : of(null)
    }
    this.initializeTimeoutObservables()
    reporter.testEntityIsExecuting(this)
    this.start = new Date
    let _this = this,
      o = //race(
        combineLatest(
        this.runTestEntity(reporter).pipe(startWith(-1)),
        // this.testTimeoutTerminator.pipe(startWith(null)),
        this.type === TestEntityType.suite
          ? of(null)
          : this.testTimeoutTerminator.pipe(tap(e => console.log('test terminator updated', this.name, e)), startWith(null)),
      ).pipe(
        switchMap(([e, terminator]) => {
          console.log(this.name, 'run update', e, terminator)
          if (terminator)
            throw terminator
            // return throwError(terminator)
          if (e === -1) return of(null)
          console.log('in end', _this.name, e)
          _this.end = new Date 
          reporter.testEntityPassed(_this)
          return of(null)
        }),
        take(2),
        catchError(e => {
          console.log('caught error', _this.name, e)
          let reasons = _this.failureReasonsOverride.length ? _this.failureReasonsOverride : [e]
          _this.end = new Date
          reporter.testEntityFailed(_this, ...reasons)
          return of(null)
        }),
        last(),
      )
    this.runStarted.next(null)
    this.runStarted.complete()
    return o as Observable<void>
  }

  protected initializeTimeoutObservables() {
    // if (this.testTimeoutSource) this.testTimeoutSource.complete()
    // if (this.runStarted) this.runStarted.complete()
    this.testTimeoutSource = new BehaviorSubject(this.testTimeout)
    this.runStarted = new Subject
    // this.testTimeoutTerminator = this.runStarted.pipe(
    //   take(1),
    this.testTimeoutTerminator = this.testTimeoutSource.pipe(
      delayWhen(() => this.runStarted),
      switchMapTo(this.testTimeoutSource),
      tap(timeout => console.log(this.name, 'switch mapping to timeout after run started')),
      switchMap(timeout => {
        console.log(this.name, 'got timeout', timeout)
        let timePassed = Date.now() - this.start.getTime(),
          remainingTime = timeout - timePassed
        console.log(this.name, 'time passed and remaining', timePassed, remainingTime)
        if (remainingTime < 0) throw new TimeoutError(`Test "${this.name}" changed timeout to ${timeout}ms, but ${timePassed}ms passed.`)
        return of(new TimeoutError(`Test "${this.name}" timed out at ${this.testTimeout}ms.`)).pipe(
          tap(() => console.log(this.name, 'delaying timeout trigger by', remainingTime)),
          delay(remainingTime),
          tap(() => console.log(this.name, 'after timeout delay')),
          take(1),
          tap(() => console.log(this.name, 'timed out!')),
          // tap(() => {throw new TimeoutError(`Test "${this.name}" timed out at ${this.testTimeout}ms.`)}),
          // mapTo('foo' as null)
          )
        }),
    )
    // ))
  }

  private doesEntityHaveSubentitiesWithOnly(entity: TestEntity) {
    if (entity.type === TestEntityType.test) return false
    let e: Suite = entity as unknown as Suite
    return !!(e.subTestEntities.find(entity => entity.opts.only))
  }

  private shouldSkipEntity(entity: TestEntity) {
    return entity.opts.skip || entity.opts.skipBecauseOfOnly
  }

  protected failureReasonsOverride: Error[] = []

  protected abstract runTestEntity(reporter: TestReporterDelegate): Observable<void>

  public setStatus(status: TestEntityStatus) {
    this._status = status
  }
}
