import { Strategy } from '../abstract'
import { makeNamed } from 'wizard-utils'

export abstract class SubFunctionStrategy<SubFunction extends Function = Function> extends Strategy {
  constructor(protected toCompose: {[key: string]: SubFunction} = {}) {
    super()
  }

  clone(): this {
    //@ts-ignore
    return new this.constructor(...this.getCloneArgs())
  }

  protected getCloneArgs() {
    return [this.toCompose]
  }

  protected baseFunction: Function
  composeOn(baseFunc: Function) {

    this.baseFunction = baseFunc
    for (let [name, func] of Object.entries(this.toCompose))
      this.composeFuncOnto(baseFunc, name, func)
  }

  protected composeFuncOnto(target: Function, name: string, func: SubFunction) {
    Object.defineProperty(target, name, {
      get: this.subFunctionGetter(func, name),
    })
  }

  protected subFunctionGetter(func: SubFunction, name: string) {
    let wrapped = null
    return () => wrapped = wrapped || this.wrapSubFunction(func, name)
  }

  protected abstract wrapSubFunction(func: SubFunction, name: string): Function

  getIllegalBaseFunctionCallErrorMessage() {
    let superMessage = super.getIllegalBaseFunctionCallErrorMessage(),
      subOptions = Object.keys(this.toCompose).map(s => '.' + s).join(', ')
    return `${superMessage}, use one of ${subOptions}`
  }
}