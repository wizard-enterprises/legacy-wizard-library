import { SubSuite, Test } from 'polymorphic-tests'
import { of } from 'rxjs'
import { doneInvoke } from 'xstate/lib/actions'
import { Invokable, StateMachine } from '../../src'
import { MachineImplementations, MachineImplementationSuite } from './index.spec'

class InvokingMachine extends StateMachine {
  id = 'machine'
  initialContext = {
    invokeValue: null,
    invokeError: null,
  }
  def = {
    initial: 'invoke1',
    states: {
      invoke1: {
        invoke: {
          id: 'sub1',
          src: 'firstInvokable',
          onDone: {
            target: 'invoke2',
            actions: this.assign({
              invokeValue: (ctx, ev) => ev.data,
            }),
          },
          onError: {
            target: 'done',
            actions: this.assign({
              invokeError: (ctx, ev) => ev.data,
            }),
          },
        },
      },
      invoke2: {
        invoke: {
          id: 'sub2',
          src: 'secondInvokable',
          onDone: {
            target: 'done',
            actions: this.assign({
              invokeValue: (ctx, ev) => ctx.invokeValue + ev.data,
            }),
          },
          onError: {
            target: 'done',
            actions: this.assign({
              invokeError: (ctx, ev) => ev.data,
            }),
          },
        },
      },
      done: {
        type: 'final' as 'final',
      },
    },
  }
}

class InvokedMachine extends StateMachine {
  initialContext = {
    doneValue: 5,
  }
  def = {
    initial: 'start',
    states: {
      start: {
        on: {
          '': 'done',
        },
      },
      done: {
        type: 'final' as 'final',
        data: ctx => ctx.doneValue,
      },
    },
  }
}

@SubSuite(MachineImplementations) class Invokables extends MachineImplementationSuite {
  @Test() 'invoke promise'(t) {
    class Implemented extends InvokingMachine {
      @Invokable() firstInvokable = Promise.resolve(5)
      @Invokable() secondInvokable(ctx, ev) {
        return Promise.resolve(5)
      }
    }
    t.ctor = Implemented
  }

  @Test() 'promisify non-invokable value'(t) {
    class Implemented extends InvokingMachine {
      @Invokable() firstInvokable = 5
      @Invokable() secondInvokable(ctx, ev) {
        return 5
      }
    }
    t.ctor = Implemented
  }

  @Test() 'invoke callback'(t) {
    class Implemented extends InvokingMachine {
      @Invokable() firstInvokable = (ctx, ev) => cb => cb(doneInvoke('sub1', 5))
      @Invokable() secondInvokable(ctx, ev) {
        return cb => cb(doneInvoke('sub2', 5))
      }
    }
    t.ctor = Implemented
  }
  
  @Test() 'invoke subscribable'(t) {
    class Implemented extends InvokingMachine {
      @Invokable() firstInvokable = of(doneInvoke('sub1', 5))
      @Invokable() secondInvokable(ctx, ev, ...rest) {
        return of(doneInvoke('sub2', 5))
      }
    }
    t.ctor = Implemented
  }

  @Test() 'invoke machine'(t) {
    class Implemented extends InvokingMachine {
      @Invokable() firstInvokable = new InvokedMachine()['pureMachine']
      @Invokable() secondInvokable(ctx, ev) {
        return new InvokedMachine()
      }
    }
    t.ctor = Implemented
  }

  finalizeMachine(machine) {
    return new Promise(res => setTimeout(res, 1))
  }
  
  validateFinalState(t, state) {
    if (state.context.invokeError) console.error(state.context.invokeError)
    t.expect(state.context.invokeValue).to.equal(10)
  }
}
