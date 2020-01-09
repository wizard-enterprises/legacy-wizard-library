import { SubSuite, Test, TestSuite } from 'polymorphic-tests'
import { Pipes, PipeSuite } from '../index.spec'
import { WrappedPipe } from '.'
import { TransformPipe } from '../transform'
import { PassThroughPipe } from '../passthrough'

@SubSuite(Pipes) class Wrapped extends TestSuite {}

class StringifiedNumberPipe extends WrappedPipe<number, string> {
  beforeWrapping = new TransformPipe<number, string>(x => `${x}`)
  afterWrapping = new TransformPipe<string, number>(s => Number(s))
}

@SubSuite(Wrapped) class StringifiedNumber extends PipeSuite {
  protected underTest = StringifiedNumberPipe

  @Test() 'empty should be NaN'(t) {
    t.expect(this.pipe()).to.be.NaN
  }

  @Test() 'transform and pass through number'(t) {
    let wrappedValue = null
    t.expect(this.pipe(10, new PassThroughPipe(s => {wrappedValue = s}))).to.equal(10)
    t.expect(wrappedValue).to.equal('10')
  }

  @Test() 'wrapped addition'(t) {
    t.expect(this.pipe(5, new TransformPipe(s => s + s))).to.equal(55)
  }

  @Test() async 'async wrappings and wrapped'(t) {
    let wait = cb => input => new Promise(res => setTimeout(() => res(cb(input)), 2)),
      lastPassedThrough = null,
      pipe = this.makePipe(new PassThroughPipe(wait(input => {lastPassedThrough = input})))
    pipe['beforeWrapping'] = new TransformPipe(wait(input => `${input}`))
    pipe['afterWrapping'] = new TransformPipe(wait(input => Number(input)))

    t.expect(await pipe.run(5)).to.equal(5)
    t.expect(lastPassedThrough).to.equal('5')
    t.expect(await pipe.run(10)).to.equal(10)
    t.expect(lastPassedThrough).to.equal('10')
  }
}