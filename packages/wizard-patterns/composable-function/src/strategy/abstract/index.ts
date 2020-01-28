export class Strategy {
  composeOn(func: Function) {}
  getIllegalBaseFunctionCallErrorMessage() {
    return `Can't be called directly`
  }
}
