import { Suite, Test } from 'polymorphic-tests'
import { assign } from 'xstate'
import { StateMachine } from '../src'
import { ResolvingStateMachineSuite } from './abstract'

class SimpleContext extends StateMachine<{foo: number}> {
  id = 'machine'
  initialContext = {
    foo: 5,
  }
  def = {
    initial: 'state',
    states: {
      state: {
        type: 'final' as 'final',
      },
    },
  }
}

@Suite() class MachinesWithContext extends ResolvingStateMachineSuite {
  protected validateFinalState(t, finalState) {
    super.validateFinalState(t, finalState)
    t.validateFinalContext(finalState.context)
  }
  
  @Test() 'have default initial context'(t) {
    t.ctor = SimpleContext
    t.validateFinalContext = context =>
      t.expect(context.foo).to.equal(5)
  }

  @Test() 'start with custom initial context'(t) {
    t.ctor = SimpleContext
    t.startNewMachine = machine => machine.start({foo: 10})
    t.validateFinalContext = context =>
      t.expect(context.foo).to.equal(10)
  }

  @Test() 'change context on entry'(t) {
    t.ctor = class extends SimpleContext {
      protected makeDef() {
        let def = {...super.makeDef()}
        def.states.state.entry = this.assign({
          foo: ctx => ctx.foo * 2,
        })
        return def
      }
    }
    t.startNewMachine = machine => machine.start({foo: 10})
    t.validateFinalContext = context =>
      t.expect(context.foo).to.equal(20)
  }

  @Test() 'change partial context on entry'(t) {
    t.ctor = class extends SimpleContext {
      initialContext = {
        foo: 5,
        bar: NaN,
      }

      protected makeDef() {
        let def = {...super.makeDef()}
        def.states.state.entry = assign({
          //@ts-ignore
          foo: ctx => ctx.foo * ctx.bar,
        })
        return def
      }
    }
    t.startNewMachine = machine => machine.start({bar: 2})
    t.validateFinalContext = context =>
      t.expect(context.foo).to.equal(10)
  }
}
