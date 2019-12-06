import { CustomIOPipe, ManualPipe } from 'wizard-patterns/lib/pipeline/pipes'
import { PipelineElementIOType as Type, PipelineElementIOType } from './types'

type StorageType = PipelineElementIOType.localStorage | PipelineElementIOType.sessionStorage

export class ComponentPipe<inputT = any, outputT = inputT> extends CustomIOPipe<Type, inputT, outputT> {
  defaultType = Type.inMemory
  public manual: ManualPipe<inputT, outputT> = new ManualPipe
  ioPipe = this.manual
  slot?: number
  factoryArgs: any[] = []
  factory(type) {
    return PipeCustomIOFactory.from(type, this)
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
    if (type === undefined) throw new Error('type is undefined')
    switch (type) {
      case Type.inMemory: return {
        input: x => x,
        output: x => x,
      }
      case Type.localStorage: return new StorageIO(PipelineElementIOType.localStorage, args[0])
      case Type.sessionStorage: return new StorageIO(PipelineElementIOType.sessionStorage, args[0])
    }
  }
}

class StorageIO<inputT = any, outputT = inputT> {
  protected storageKey: string
  constructor(protected type: StorageType, protected pipe: ComponentPipe) {
    this.storageKey = pipe.factoryArgs[0]
  }

  input(): inputT {
    return new StorageIOReader<inputT>(this.type, this.storageKey).read(false)
  }

  output(output: outputT) {
    window[this.type].setItem(this.storageKey, JSON.stringify({
      index: this.pipe.slot,
      value: output,
    }))
  }
}

export class StorageIOReader<outputT = any> {
  constructor(private type: StorageType, protected storageKey: string) {}

  read(withMetadata = true): outputT {
    let full = JSON.parse(window[this.type].getItem(this.storageKey))
    return withMetadata
      ? full
      : full.value
  }
}