import { SubFunctionStrategy } from '../abstract/subfunction'

export class ArgsBuilderStrategy extends SubFunctionStrategy {
  private argBuilders = []

  constructor(toCompose, protected config: any = {}) {
    super(toCompose)
  }

  protected getCloneArgs() {
    return [...super.getCloneArgs(), this.config]
  }

  protected subFunctionGetter(func, name) {
    let superGetter = super.subFunctionGetter(func, name)
    return () => {
      this.argBuilders.push(func)
      return superGetter()
    }
  } 

  protected wrapSubFunction() {
    let wrapped = (...passedArgs) =>
      this.baseFunction(...this.buildArgs(...passedArgs))
    if (this.config.recursive)
      this.clone().composeOn(wrapped)
    return wrapped
  }

  protected buildArgs(...passedArgs) {
    let args = this.argBuilders.reduce((acc, build) => build(...acc), passedArgs)
    this.argBuilders = []
    return args
  }
}