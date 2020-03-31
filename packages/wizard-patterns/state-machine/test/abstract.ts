import { TestSuite } from 'polymorphic-tests'
import { StateMachine } from '../src'

export class ResolvingStateMachineSuite extends TestSuite {
  protected machine: StateMachine
  protected ctor

  protected async after(t) {
    if (!t.startNewMachine)
      t.startNewMachine = machine => machine.start()
    let ctor = t.ctor || this.ctor
    this.machine = t.startNewMachine(new ctor().decorateInstance())
    let finalState = await this.getFinalState(t, this.machine)
    this._validateFinalState(t, finalState)
  }

  protected async getFinalState(t, machine) {
    if (t.finalizeMachine)
      await t.finalizeMachine(machine)
    else
      await this.finalizeMachine(t, machine)
    return machine.state
  }

  private _validateFinalState(t, finalState) {
    if (t.validateFinalState) {
      this.validateFinalStateIsDone(t, finalState)
      t.validateFinalState(finalState)
    }
    else
      this.validateFinalState(t, finalState)
  }

  protected finalizeMachine(t, machine) {}
  protected validateFinalState(t, finalState) {
    this.validateFinalStateIsDone(t, finalState)
  }

  private validateFinalStateIsDone(t, finalState) {
    t.expect(finalState.done).to.equal(true)
  }

  protected getImplementations() {
    //@ts-ignore
    return this.machine.instance.options
  }
}
