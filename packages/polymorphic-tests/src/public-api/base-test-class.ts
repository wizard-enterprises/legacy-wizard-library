export interface TestSuiteRunnerDelegate {
  runTestPolymorphically(testName: string): Promise<void>,
}

export class TestSuite implements TestSuiteRunnerDelegate {
  setup(): any|Promise<any> {}
  teardown(): any|Promise<any> {}
  before(): any|Promise<any> {}
  after(): any|Promise<any> {}

  public async runTestPolymorphically(testName: string) {
    let clone = this.cloneSelf()
    await clone.before()
    await clone[testName]()
    await clone.after()
  }

  private cloneSelf(obj = this) {
    if (obj === null || typeof obj !== 'object')
      return obj
    let props = Object.getOwnPropertyDescriptors(obj)
    for (let key in props)
      props[key].value = this.cloneSelf(props[key].value)
    return Object.create(
      Object.getPrototypeOf(obj), 
      props,
    )
  }
}