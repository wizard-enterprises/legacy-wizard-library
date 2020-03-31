import { SubSuite, Test } from 'polymorphic-tests'
import { MachineImplementations, MachineImplementationSuite } from './index.spec'
import { StateMachine, Guard } from '../../src'

class PatchedMachine extends StateMachine {
  id = 'machine'
  def = {
    initial: 'initial',
    states: {
      initial: {
        on: {
          '': [
            { target: 'bad1', cond: 'never' },
            { target: 'bad2', cond: 'never' },
            { target: 'done', cond: 'always' },
            'bad3',
          ],
        }
      },
      bad1: {},
      bad2: {},
      bad3: {},
      done: {
        type: 'final' as 'final',
      },
    },
  }

  guardCallsCount = 0
  @Guard() never() {
    this.guardCallsCount++
    return false
  }
  @Guard() always() {
    this.guardCallsCount++
    return true
  }
}

@SubSuite(MachineImplementations) class Guards extends MachineImplementationSuite {
  ctor = PatchedMachine
  @Test() 'always block specific transition' (t) {
    t.validateFinalState = state =>
      t.expect(this.machine.guardCallsCount).to.equal(3)
  }
}

class ContextualMachine extends StateMachine {
  id = 'machine'
  initialContext = {
    finalState: 'defaultFinal',
  }
  contextualTarget = (target: string) => ({
    target,
    cond: {type: 'fitsContext', target}
  })
  def = {
    initial: 'initial',
    states: {
      initial: {
        on: {
          '': [
            this.contextualTarget('defaultFinal'),
            this.contextualTarget('final1'),
            this.contextualTarget('final2'),
            'bad',
          ],
        },
      },
      bad: { type: 'final' as 'final' },
      defaultFinal: { type: 'final' as 'final' },
      final1: { type: 'final' as 'final' },
      final2: { type: 'final' as 'final' },
    },
  }

  @Guard() fitsContext(context, event, {cond}) {
    return context.finalState === cond.target
  }
}

@SubSuite(Guards) class Contextual extends MachineImplementationSuite {
  ctor = ContextualMachine

  @Test() 'resolves by default context'(t) {
    t.validateFinalState = state =>
      t.expect(state.value).to.equal('defaultFinal')
  }

  @Test() 'contextually resolve to final1'(t) {
    t.startNewMachine = machine => machine.start({finalState: 'final1'})
    t.validateFinalState = state =>
      t.expect(state.value).to.equal('final1')
  }

  @Test() 'contextually resolve to final2'(t) {
    t.startNewMachine = machine => machine.start({finalState: 'final2'})
    t.validateFinalState = state =>
      t.expect(state.value).to.equal('final2')
    }
    
  @Test() 'resolve to bad state given unknown context'(t) {
    t.startNewMachine = machine => machine.start({finalState: 'made up'})
    t.validateFinalState = state =>
      t.expect(state.value).to.equal('bad')
  }
}