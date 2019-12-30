import { CustomIOPipe, ManualPipe } from 'wizard-patterns/lib/pipeline/pipes'
import { PipelineElementIOType as Type, PipelineElementIOType } from './types'

type StorageType = PipelineElementIOType.localStorage | PipelineElementIOType.sessionStorage

export class ComponentPipe<inputT = any, outputT = inputT> extends CustomIOPipe<Type, inputT, outputT> {
  defaultType = Type.inMemory
  public manual: ManualPipe<inputT, outputT> = new ManualPipe
  ioPipe = this.manual
  slot?: number
  factoryArgs: any[] = []

  factory(type = this.type) {
    return PipeCustomIOFactory.from<inputT, outputT>(type, this)
  }

  run(input: inputT) {
    if (this.manual === undefined) this.manual = new ManualPipe
    return super.run(input)
  }
}

class PipeCustomIOFactory {
  static from<inputT = any, outputT = inputT>(type: Type, ...args: any[]) {
    return new PipeCustomIOFactory().forType<inputT, outputT>(type, ...args)
  }

  forType<inputT = any, outputT = inputT>(type: Type, ...args: any[]) {
    switch (type) {
      case Type.inMemory: return new PassThroughIO<inputT, outputT>()
      case Type.localStorage: return new StorageIO<inputT, outputT>(PipelineElementIOType.localStorage, args[0])
      case Type.sessionStorage: return new StorageIO<inputT, outputT>(PipelineElementIOType.sessionStorage, args[0])
      case Type.queryParams: return new QueryParamsIO<inputT, outputT>(args[0])
      default: throw new Error(`type ${type} not supported by factory')`)
    }
  }
}

class PassThroughIO<inputT = any, outputT = inputT> {
  input(input?: inputT): inputT { return input }
  output(output: outputT): outputT { return this.parseOutputForStorage(output) }
  parseOutputForStorage(output: outputT) { return output }
}

class IOForPipe<inputT = any, outputT = inputT> extends PassThroughIO<inputT, outputT> {
  constructor(protected pipe: ComponentPipe) { super() }
  //@ts-ignore
  parseOutputForStorage(output) {
    return {
      index: this.pipe.slot + 1,
      value: output,
    }
  }
}

class StorageIO<inputT = any, outputT = inputT> extends IOForPipe<inputT, outputT> {
  protected storageKey: string
  constructor(protected type: StorageType, protected pipe: ComponentPipe) {
    super(pipe)
    this.storageKey = pipe.factoryArgs[0]
  }

  input() {
    return new StorageIOReader<inputT>(this.type, this.storageKey).read(false)
  }

  output(output) {
    let out = super.output(output)
    window[this.type].setItem(this.storageKey, JSON.stringify(out))
    //@ts-ignore
    return out.value
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

class QueryParamsIO<inputT = any, outputT = inputT> extends IOForPipe<InputEvent, outputT> {
  input() {
    let query = new URLSearchParams(window.location.search)
    return JSON.parse(query.get('value'))
  }

  output(output) {
    let out = super.output(output)
    let search = Object.entries(out)
      .map(([key, value]) => key += (value === true ? '' : `=${JSON.stringify(value)}`))
      .join('&')
    window.location.search = search
    //@ts-ignore
    return out.value
  }
}
