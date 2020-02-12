import { SubFunctionStrategy } from '../abstract/subfunction'

export class ArgsBuilderStrategy extends SubFunctionStrategy {
  private argBuilders = []

  constructor(toCompose, protected config: any = {}) {
    super(toCompose)
  }

  protected getCloneArgs() {
    return [...super.getCloneArgs(), this.config]
  }
  
  protected getSubFunction(name, target) {
    let toCompose = this.toCompose[name]
    this.argBuilders.push((...args) => toCompose(...args))
    return super.getSubFunction(name, target)
  } 

  protected wrapSubFunction(func, name, target) {
    let wrapped = this.getArgWrappedFunc(target)
    return this.config.recursive
      ? this.clone().composeOn(wrapped)
      : wrapped
  }

  protected getArgWrappedFunc(target) {
    let self = this
    return function (...passedArgs) {
      return self.getBaseFunction().call(target, ...self.buildArgs(...passedArgs))
    }
  }

  protected buildArgs(...passedArgs) {
    let args = this.argBuilders.reduce((acc, build) => build(...acc), passedArgs)
    this.argBuilders = []
    return args
  }
}