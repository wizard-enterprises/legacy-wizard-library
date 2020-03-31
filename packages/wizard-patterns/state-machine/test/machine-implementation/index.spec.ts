import { Suite, TestSuite } from 'polymorphic-tests'
import { ResolvingStateMachineSuite } from '../abstract'

@Suite() export class MachineImplementations extends TestSuite {}

export class MachineImplementationSuite extends ResolvingStateMachineSuite {}