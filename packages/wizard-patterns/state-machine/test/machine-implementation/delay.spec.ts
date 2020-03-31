import { SubSuite, Test } from 'polymorphic-tests'
import { MachineImplementations, MachineImplementationSuite } from './index.spec'
import { StateMachine, machine, Delay } from '../../src'

class DelayedMachine extends StateMachine {
  id = 'machine'
  initialContext = {
    delay: 5,
  }
  def = {
    initial: 'initial',
    states: {
      initial: {
        after: {
          staticDelay: 'afterStatic',
        },
      },
      afterStatic: {
        after: {
          contextualDelay: 'done',
        },
      },
      done: {
        type: 'final' as 'final',
      },
    },
  }

  @Delay() staticDelay = 5
  @Delay() contextualDelay(context, event) {
    return context.delay
  }
}

@SubSuite(MachineImplementations) class Delays extends MachineImplementationSuite {
  ctor = DelayedMachine
  @Test() 'resolve static and contextual delays' (t) {
    t.startNewMachine = machine => machine.start({delay: 10})
    t.finalizeMachine = async machine => {
      t.expect(machine.state.value).to.equal('initial')
      await new Promise(res => setTimeout(res, 5))
      t.expect(machine.state.value).to.equal('afterStatic')
      await new Promise(res => setTimeout(res, 5))
      t.expect(machine.state.value).to.equal('afterStatic')
      await new Promise(res => setTimeout(res, 5))
    }
    t.validateFinalState = state =>
      t.expect(state.value).to.equal('done')
  }
}
