enum ConsoleCallTypes {
  log, warning, error,
}

class ConsoleSpy {
  calls = []

  log(...toLog) {
    this.registerCall(ConsoleCallTypes.log, toLog)
  }
  
  private registerCall(type, args) {
    this.calls.push({
      type, args,
      timestamp: Date.now(),
    })
  }
}

function getEnvironmentalConsole() {
  if (this.window) return this.window.console 
  //@ts-ignore
  if (this.global) return this.global.console
}

class TestSuite {
  get id() {
    return `suite_${this.parentSuite.id}_${this.name}`
  }
  name
  parentSuite: TestSuite
  subSuitesAndTests: Array<TestSuite | TestMethod> = []
  constructor(name, parentSuite, opts: any = {}) {
    this.name = name
    this.parentSuite = parentSuite
  }

  addSubSuiteOrTest(suiteOrTest: TestSuite | TestMethod) {
    this.subSuitesAndTests.push(suiteOrTest)
  }

  async run() {
    for (let suiteOrTest of this.subSuitesAndTests)
      await suiteOrTest.run()
  }
}

class GlobalTestSuite extends TestSuite {
  private instance = null
  constructor(opts: any = {}) {
    super('global', null, opts)
    if (this.instance) return this.instance
    this.parentSuite = this
    this.instance = this
    return this.instance
  }
}

class TestMethod {
  get id() {
    return `test_${this.parentSuite.id}_${this.name}`
  }
  name
  parentSuite
  boundMethod
  console
  constructor(name, parentSuite, boundMethod, opts: any = {}) {
    this.name = name
    this.boundMethod = boundMethod
    this.parentSuite = parentSuite
    this.console = opts.console || getEnvironmentalConsole()
  }

  async run() {
    await this.boundMethod()
  }
}

class AssertionError extends Error {
  constructor(...args) {
    super(...args)
    //@ts-ignore
    if (Error.captureStackTrace) Error.captureStackTrace(this, AssertionError)
  }
}

function assertPrimitiveEqual(a, b, message?) {
  assertIdentical(
    JSON.stringify(a), JSON.stringify(b),
    message || `Expected ${a} to primitively equal to ${b}`
  )
}

function assertIdentical(a, b, message?) {
  assert(a === b, message || `Expected ${a} to be identical to ${b}`)
}

function assert(boolean, message) {
  if (!boolean) throw new AssertionError(message)
}

new TestMethod('basic test', new GlobalTestSuite, async () => {
  let consoleSpy = new ConsoleSpy,
    test = new TestMethod('spied test', new GlobalTestSuite, () => consoleSpy.log('inside test'), {console: consoleSpy})
  
  consoleSpy.log('before test')
  await test.run()
  consoleSpy.log('after test')

  assertPrimitiveEqual(
    consoleSpy.calls.map(call => call.args[0]),
    ['before test', 'inside test', 'after test']
  )
}).run()

