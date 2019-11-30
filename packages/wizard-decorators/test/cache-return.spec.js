import { Suite, Test } from 'polymorphic-tests'
import { CachedReturn } from '../src/cached-return'
import { DecoratorSuite } from '../src/decorator-suite'

@Suite() export class CacheReturnDecorator extends DecoratorSuite {
  decoratorClass = CachedReturn
  @Test() 'decorated instance methods are called once'(t) {
    let calls = []
    class C {
      @this.decorate static x(throws = false) {
        if (throws) throw new Error(2)
        calls.push('static')
        return 2
      }
      @this.decorate x(throws = false) {
        if (throws) throw new Error(5)
        calls.push('instance')
        return 5
      }
    }
    let c = new C
    t.expect(calls).to.deep.equal([])
    t.expect(C.x()).to.equal(C.x())
    t.expect(c.x()).to.equal(c.x())
    t.expect(calls)
      .to.deep.equal(['static', 'instance'])
    t.expect(() => C.x(true)).not.to.throw('2')
    t.expect(() => new C().x(true)).to.throw('5')
  }

  @Test() 'decorated methods are bound to instance'(t) {
    class C {
      x = 5
      @this.decorate getX() { return this.x }
      @this.decorate throwX() { throw new Error(this.x) }
    }
    let c = new C
    t.expect(c.x).to.equal(5)
    let ret
    t.expect(() => ret = c.getX()).not.to.throw()
    t.expect(ret).to.equal(5)
    t.expect(() => c.throwX()).to.throw('5')
  }

  @Test() 'decorated getters are called once'(t) {
    let calls = []
    class C {
      @this.decorate static get x() {
        calls.push('static')
        return 10
      }
      @this.decorate get x() {
        calls.push('instance')
        return 5
      }
      @this.decorate static get throwX() {
        throw new Error(10)
      }
      @this.decorate get throwX() {
        throw new Error(5)
      }
    }
    let c = new C
    t.expect(calls).to.deep.equal([])
    t.expect(C.x).to.equal(C.x)
    t.expect(c.x).to.equal(c.x)
    t.expect(calls)
      .to.deep.equal(['static', 'instance'])
    t.expect(() => C.throwX()).to.throw('10')
    t.expect(() => c.throwX()).to.throw('5')
  }

  @Test() 'decorated methods and getters are called once per instance'(t) {
    class C {
      static getterValue
      static constant = 10
      constant = 10
      @this.decorate static get getter() { return C.getterValue + this.constant }
      @this.decorate get getter() { return C.getterValue + this.constant }
      @this.decorate method(x) { return x + this.constant }
    }
    C.getterValue = 1
    let c1 = new C
    t.expect(c1.getter).to.equal(11)
    t.expect(C.getter).to.equal(c1.getter)
    t.expect(c1.method(5)).to.equal(c1.method()).to.equal(15)
    C.getterValue = 2
    let c2 = new C
    t.expect(c2.method(10)).to.equal(c2.method()).to.equal(20)
    t.expect(c2.getter).to.equal(12)
    t.expect(c1.getter).to.equal(11)
    t.expect(C.getter).to.equal(c1.getter).not.to.equal(c2.getter)
  }

  @Test() 'decorated classes are singletons by constructor and getInstance'(t) {
    let callCount = 0
    @this.decorate class C {
      constructor() { this.i = callCount++ }
    }
    @this.decorate class ThrowingC {
      constructor() { throw new Error('ctor error') }
    }
    t.expect(callCount).to.equal(0)
    let i1 = new C
    let i2 = new C
    let i3 = C.getInstance()
    t.expect(callCount).to.equal(1)
    t.expect(i1).to.equal(i2).to.equal(i3)
    t.expect(() => new ThrowingC).to.throw('ctor error')
  }
}