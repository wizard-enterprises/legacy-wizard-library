import { SubSuite, Test } from 'polymorphic-tests'
import { Pipes, PipeSuite } from '../index.spec'
import { PassThroughPipe } from '.'

@SubSuite(Pipes) class PassThrough extends PipeSuite<PassThroughPipe> {
  protected underTest = PassThroughPipe

  @Test() 'pass through only'(t) {
    t.expect(this.pipe(5)).to.equal(5)
  }

  @Test() 'pass through with action'(t) {
    let calledWith = null
    this.makePipe(x => calledWith = x)
    t.expect(calledWith).to.equal(null)
    this.pipe(5)
    t.expect(calledWith).to.equal(5)
    this.pipe(10)
    t.expect(calledWith).to.equal(10)
  }

  @Test() async 'wait for async or promise'(t) {
    let calls = [],
      promiseFunc = callsIndex => (input?) => new Promise(res =>
        setTimeout(() => {
          calls[callsIndex] = input
          res()
        }, 10 + callsIndex)
      ),
      pipeThroughAsyncFunc = this.makePipe(promiseFunc(0)).run('data'),
      pipeThroughProm = this.makePipe(promiseFunc(1)()).run('data'),
      bothPipes = [pipeThroughAsyncFunc, pipeThroughProm]
    for (let prom of bothPipes)
      t.expect(prom).to.be.an.instanceof(Promise)
    t.expect(calls).to.deep.equal([])
    t.expect(await Promise.all(bothPipes)).to.deep.equal(new Array(2).fill('data'))
    t.expect(calls).to.deep.equal(['data', undefined])
  }
}