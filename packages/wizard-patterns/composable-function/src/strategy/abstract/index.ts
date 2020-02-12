export class Strategy {
  public clone(): this {
    //@ts-ignore
    return new this.constructor(...this.getCloneArgs())
  }
  protected getCloneArgs() {
    return []
  }

  protected getBaseFunction: () => Function
  public composeOn(func: Function): Function {
    func = func === null
      ? () => {
          throw new Error(this.getIllegalBaseFunctionCallErrorMessage())
        }
      : func
    this.getBaseFunction = () => func
    return new Proxy(func, this.getProxyHandler())
  }
  protected getProxyHandler(): ProxyHandler<Function> {
    return {}
  }
  public getIllegalBaseFunctionCallErrorMessage() {
    return `Can't be called directly`
  }
}
