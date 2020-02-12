import { Strategy } from '../abstract'
import { makeNamed } from 'wizard-utils'

export abstract class SubFunctionStrategy<SubFunction extends Function = Function> extends Strategy {
  protected composed = {}
  constructor(protected toCompose: {[key: string]: SubFunction} = {}) {
    super()
  }

  protected getCloneArgs() {
    return [this.toCompose]
  }

  getProxyHandler() {
    let self = this
    return {
      get(target, propName) {
        return self.getSubFunction(propName, target)
      }
    }
  }

  protected getSubFunction(name: string, target) {
    return this.composed[name] || (
      this.composed[name] =
        this.wrapSubFunction(this.toCompose[name], name, target)
    )
  }

  protected wrapSubFunction(func: SubFunction, name: string, target): Function {
    return makeNamed(name, func)
  }

  getIllegalBaseFunctionCallErrorMessage() {
    let superMessage = super.getIllegalBaseFunctionCallErrorMessage(),
      subOptions = Object.keys(this.toCompose).map(s => '.' + s).join(', ')
    return `${superMessage}, use one of ${subOptions}`
  }
}