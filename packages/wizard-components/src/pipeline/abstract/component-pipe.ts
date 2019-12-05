import { CustomIOPipe, ManualPipe } from 'wizard-patterns/lib/pipeline/pipes'
import { PipelineElementIOType as Type } from './types'

export class ComponentPipe<inputT = any, outputT = inputT> extends CustomIOPipe<Type, inputT, outputT> {
  defaultType = Type.inMemory
  public manual: ManualPipe<inputT, outputT> = new ManualPipe
  ioPipe = this.manual
  factoryArgs: any[] = []
  factory(type) {
    return PipeCustomIOFactory.from(type, ...this.factoryArgs)
  }

  run(input: inputT) {
    if (this.manual === undefined) this.manual = new ManualPipe
    return super.run(input)
  }
}

class PipeCustomIOFactory {
  static from(type: Type, ...args: any[]) {
    return new PipeCustomIOFactory().forType(type, ...args)
  }

  forType(type: Type, ...args: any[]) {
    console.log('getting IO for type', type)
    if (type === undefined) throw new Error('type is undefined')
    switch (type) {
      case Type.inMemory: return {
        input: x => x,
        output: x => x,
      }
      case Type.localStorage: return new StorageIO(StorageType.local, args[0])
      case Type.sessionStorage: return new StorageIO(StorageType.session, args[0])
    }
  }
}

enum StorageType {
  local = 'local',
  session = 'session',
}
class StorageIO<inputT = any, outputT = inputT> {
  private windowStorage: string
  constructor(type: StorageType, private storageKey: string) {
    this.windowStorage = `${type}Storage`
  }

  input(): inputT {
    return JSON.parse(window[this.windowStorage].getItem(this.storageKey))
  }

  output(output: outputT) {
    window[this.windowStorage].setItem(this.storageKey, JSON.stringify(output))
  }
}