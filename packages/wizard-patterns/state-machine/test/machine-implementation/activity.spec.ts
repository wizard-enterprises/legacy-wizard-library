import { SubSuite, Test } from 'polymorphic-tests'
import { MachineImplementations, MachineImplementationSuite } from './index.spec'
import { StateMachine, machine, Activity, Guard } from '../../src'
import { log } from 'xstate/lib/actions';

type IncrementingMachineContext = {
  counter: number,
  incrementBy: number,
  incrementCount: number,
}

type IncrementingMachineStateSchema = {
  states: {
    counting: {},
    stopped: {},
    done: {},
  },
}

type IncrementingMachineEvent =
  | {type: 'INCREMENT', by: number}
  | {type: 'STOP'}
  | {type: 'FINALIZE'};

class IncrementingMachine extends StateMachine<IncrementingMachineContext, IncrementingMachineStateSchema, IncrementingMachineEvent> {
  id = 'machine'
  initialContext = {
    counter: 0,
    incrementBy: 1,
    incrementCount: 0,
  }
  def = {
    initial: 'counting' as 'counting',
    on: {
      INCREMENT: {
        actions: [
          this.assign({
            //@ts-ignore
            counter: (ctx, ev) => ctx.counter + ev.by,
            incrementCount: ctx => ctx.incrementCount + 1,
          }),
        ],
      },
      '': {
        cond: 'didIncrementTenTimes',
        actions: [
          this.assign({incrementCount: () => -100}),
          () => this.instance.send('STOP'),
        ],
      }
    },
    states: {
      counting: {
        activities: 'incrementOverTime',
        on: {
          STOP: 'stopped',
        },
      },
      stopped: {
        on: {
          FINALIZE: 'done',
        },
      },
      done: {
        type: 'final' as 'final',
      },
    },
  }

  @Guard() didIncrementTenTimes(context) {
    return context.incrementCount >= 10
  }

  @Activity() incrementOverTime(context) {
    let interval = setInterval(() => this.increment(context.incrementBy), 1)
    return () => clearInterval(interval)
  }

  private increment(by: number) {
    this.instance.send({type: 'INCREMENT', by})
  }

  public finalize() {
    this.instance.send('FINALIZE')
  }
}

@SubSuite(MachineImplementations) class Activities extends MachineImplementationSuite {
  ctor = IncrementingMachine
  @Test() 'increment by 1 to 10' (t) {
    t.validateFinalState = state =>
      t.expect(state.context.counter).to.equal(10)
  }

  @Test() 'increment by 5 to 50'(t) {
    t.startNewMachine = machine =>
      machine.start({incrementBy: 5})
    t.validateFinalState = state =>
      t.expect(state.context.counter).to.equal(50)
  }

  async finalizeMachine(t, machine) {
    super.finalizeMachine(t, machine)
    t.expect(machine.state.value).to.equal('counting')
    t.expect(machine.state.context.counter).to.equal(0)
    await new Promise(res => setTimeout(res, 25))
    t.expect(machine.state.value).to.equal('stopped')
    await new Promise(res => setTimeout(res, 10))
    machine.finalize()
    t.expect(machine.state.value).to.equal('done')
  }
}
