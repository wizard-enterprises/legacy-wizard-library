import { SubSuite, Test } from 'polymorphic-tests'
import { MachineImplementations, MachineImplementationSuite } from './index.spec'
import { StateMachine, Action, Invokable } from '../../src'

abstract class IncrementingMachine extends StateMachine {
  def = {
    initial: 'start',
    states: {
      start: {
        entry: 'incrementOne',
        exit: 'incrementTwo',
        on: {
          '': {
            target: 'done',
            actions: 'incrementThree',
          },
        },
      },
      done: {
        type: 'final' as 'final',
      },
    },
  }
}

@SubSuite(MachineImplementations) class Actions extends MachineImplementationSuite {
  @Test() 'side effects only' (t) {
    class Machine extends IncrementingMachine {
      initialContext = {
        incrementBy: 1,
      }
      counter = 0
      @Action() incrementOne(ctx) {
        this.incrementTo(1, ctx)
      }
      @Action() incrementTwo(ctx) {
        this.incrementTo(2, ctx)
      }
      @Action() incrementThree(ctx) {
        this.incrementTo(3, ctx)
      }

      private incrementTo(expectedIncrementTo, {incrementBy}) {
        if (this.counter + incrementBy !== expectedIncrementTo)
          throw new Error(`this.counter + incrementBy !== expectedIncrementBy, ${this.counter + incrementBy} !== ${expectedIncrementTo}`)
        this.counter += incrementBy
      }
    }
    t.ctor = Machine
    t.validateFinalState = state =>
      t.expect((<Machine>this.machine).counter).to.equal(3)
  }

  @Test() '@Action.assign()'(t) {
    class Machine extends IncrementingMachine {
      initialContext = {
        counter: 0,
      }
      
      @Action.assign() incrementOne = {
        counter: 1,
      }

      @Action.assign() incrementTwo() {
        return {
          counter: 2,
        }
      }

      private readonly three = 3
      @Action.assign() incrementThree = {
        counter: ctx => {
          if (ctx.counter + 1 !== this.three)
            throw new Error(`ctx.counter + 1 !== this.three, ${ctx.counter + 1} !== ${this.three}`)
          return this.three
        }
      }
    }
    t.ctor = Machine
    t.validateFinalState = state =>
      t.expect(state.context.counter).to.equal(3)
  }

  @Test() '@Action.send({to: \'invoked\'})'(t) {
    class Machine extends StateMachine {
      def = {
        initial: 'start',
        states: {
          start: {
            entry: 'resolveInvoked',
            invoke: {
              id: 'invoked',
              src: 'invokedMachine',
              onDone: 'done'
            },
          },
          done: {
            type: 'final' as 'final',
          },
        },
      }

      @Invokable() invokedMachine() {
        return new InvokedMachine()['pureMachine']
      }

      @Action.send({to: 'invoked'}) resolveInvoked = 'RESOLVE'
    }

    class InvokedMachine extends StateMachine {
      def = {
        initial: 'waiting',
        states: {
          waiting: {
            on: {
              RESOLVE: 'done',
            },
          },
          done: {
            type: 'final' as 'final',
          },
        }
      }
    }
    t.ctor = Machine
  }
}
