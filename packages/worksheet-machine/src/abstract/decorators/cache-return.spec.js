import { SubSuite, Test } from 'polymorphic-tests'
import { Decorators, DecoratorSuite } from './abstract.spec'
import { CachedReturn } from './cached-return'

@SubSuite(Decorators) export class CacheReturnDecorator extends DecoratorSuite {
  decoratorClass = CachedReturn
  @Test() 'decorated methods are called once'(t) {
    let calls = []
    class C {
      @this.decorate
      static x() {
        calls.push('static')
        return 2
      }
      @this.decorate
      x() {
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
    }
    let c = new C
    t.expect(calls).to.deep.equal([])
    t.expect(C.x).to.equal(C.x)
    t.expect(c.x).to.equal(c.x)
    t.expect(calls)
      .to.deep.equal(['static', 'instance'])
  }

  @Test() 'decorated classes are singletons by constructor and getInstance'(t) {
    let callCount = 0
    @this.decorate class C {
      constructor() { this.i = callCount++ }
    }
    t.expect(callCount).to.equal(0)
    let i1 = new C
    let i2 = new C
    let i3 = C.getInstance()
    t.expect(callCount).to.equal(1)
    t.expect(i1).to.equal(i2).to.equal(i3)
    t.expect(i1.i).to.equal(i2.i).to.equal(i3.i)
  }
}