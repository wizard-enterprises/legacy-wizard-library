import { from, Observable } from 'rxjs'
import { TestEntity, TestEntityIdStore, TestEntityOpts, TestEntityType } from "../core/abstract-test-entity"
import { assert } from "../core/assert"
import { TestReporterDelegate } from "../core/reporters/test-reporter"

export interface TestMethodOpts extends TestEntityOpts {}

export class TestMethod extends TestEntity<TestMethodOpts> {
  public type = TestEntityType.test
  // private runStarted: Subject<void>
  // private testTimeoutTerminator: Observable<TimeoutError>

  constructor(name: string, public boundMethod: Function, opts: TestMethodOpts = {}, idStore?: TestEntityIdStore) {
    super(name, opts, idStore)
  }

  protected makeTestArg(): TestArg {
    return {
      assert,
    }
  }

  public methodBinding?: Object
  public runTestEntity(reporter: TestReporterDelegate): Observable<void> {
    // let makeRunTest = () =>
    let boundMethod = this.methodBinding ? this.boundMethod.bind(this.methodBinding) : this.boundMethod
     return (from(Promise.resolve(boundMethod(this.makeTestArg())))) as Observable<void>
    // this.initializeTimeoutObservables()
    // let _this = this,
    //   o = //race(
    //     combineLatest(
    //     this.runTestEntity(reporter).pipe(startWith(-1)),
    //     // this.testTimeoutTerminator.pipe(startWith(null)),
    //     this.testTimeoutTerminator.pipe(startWith(null))
    //   ).pipe(
    //     tap(([e, terminator]) => {
    //       if (terminator)
    //         throw terminator
    //       if (e === -1) return
    //       console.log('in end', _this.name, e)
    //       _this.end = new Date 
    //       reporter.testEntityPassed(_this)
    //     }),
    //     take(2),
    //     catchError(e => {
    //       console.log('caught error', _this.name, e)
    //       let reasons = _this.failureReasonsOverride.length ? _this.failureReasonsOverride : [e]
    //       _this.end = new Date
    //       reporter.testEntityFailed(_this, ...reasons)
    //       return of()
    //     }),
    //     last(),
    //   )
    // this.runStarted.next(null)
    // this.runStarted.complete()
    // return o as Observable<void>
  }
}

export interface TestArg {
  assert: typeof assert,
}