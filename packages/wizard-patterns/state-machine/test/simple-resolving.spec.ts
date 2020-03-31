import { Suite, Test } from 'polymorphic-tests'
import { StateMachine, machine } from '../src'
import { ResolvingStateMachineSuite } from './abstract'

@Suite() class SimpleResolvingMachines extends ResolvingStateMachineSuite {
  @Test() 'initially resolved'(t) {
    t.ctor = class Machine extends StateMachine {
      id = 'machine'
      def = {
        initial: 'state',
        states: {
          state: {
            type: 'final' as 'final',
          },
        },
      }
    }
  }

  @Test() 'resolve transiently'(t) {
    t.ctor = class Machine extends StateMachine {
      id = 'machine'
      def = {
        initial: 'transient',
        states: {
          transient: {
            on: {
              '': 'end',
            },
          },
          end: {
            type: 'final' as 'final',
          },
        },
      }
    }
    t.validateFinalState = state =>
      t.expect(state.value).to.equal('end')
  }

  @Test() 'resolve manually'(t) {
    t.ctor = class Machine extends StateMachine {
      id = 'machine'
      def = {
        initial: 'idle',
        states: {
          idle: {
            on: {
              'RESOLVE': 'end',
            },
          },
          end: {
            type: 'final' as 'final',
          },
        },
      }

      resolve() {
        this.instance.send('RESOLVE')
      }
    }
    t.finalizeMachine = machine => machine.resolve()
    t.validateFinalState = state =>
      t.expect(state.value).to.equal('end')
  }
}
