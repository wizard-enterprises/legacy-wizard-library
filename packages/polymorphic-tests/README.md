<h1 align="center">Welcome to polymorphic-tests 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/polymorphic-tests" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/polymorphic-tests.svg">
  </a>
  <a href="https://github.com/wizard-enterprises/wizard-library/blob/master/packages/polymorphic-tests/README.md" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/wizard-enterprises/wizard-library/blob/master/packages/polymorphic-tests/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/wizard-enterprises/wizard-library/blob/master/packages/polymorphic-tests/LICENSE" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/github/license/wizard-enterprises/polymorphic-tests" />
  </a>
</p>

> Polymorphic test framework for JS by Wizard Enterprises.

### 🏠 [Homepage](https://github.com/wizard-enterprises/wizard-library/blob/master/packages/polymorphic-tests)

See also [`polymorphic-web-component-tests`](../packages/polymorphic-web-component-tests).

## Setting Up
Install with `npm i -D polymorphic-tests` or `yarn add -D polymorphic-tests`.

Once `polymorphic-tests` is installed, run `./node_modules/.bin/polytest init` to configure your project.

This tool depends on stage-0 decorators, implemented through either Babel or TypeScript. This is configured automatically through the `init` command, but configuring TypeScript or Babel is left to the user (see [examples](/examples)).

Running is done simply through `./node_modules/.bin/polytest run`. This can be added to your npm scripts (and is during `init`, if it's not defined) for added convenience.

## Configuring
The `init` command generates a `polytest.js` file in your project, which exports configuration for running your tests. See `./node_modules/.bin/polytest help run` for nearly full options.

Nearly because the `run --setup` flag only accepts globs to setup files, while the `polytest.js#setup` field can additionally accept plain old functions to run during setup.

## Writing Tests
> This section assumes you understand polymorphism through class extension in JS.

### Simple Test
Tests are written in classes extending `TestSuite`, and must both `extend TestSuite` and be decorated with the `@Suite()` decorator, for reasons that will be explained below.

*Note: test methods may always return a promise to be awaited.*

```ts
import { Test, Suite, TestSuite } from 'polymorphic-tests'

@Suite() class MySuite extends TestSuite {
  @Test() '1 + 1 = 2'(t) {
    t.expect(add(1, 1)).to.equal(2)
  }
}

function add(x, y) {
  return x + y
}
```

`t.expect` here is from the [Chai Assertion Library](https://www.chaijs.com/). `t` also includes Chai's `should` and `assert` APIs. Chai can be configured further by configuring `setup`, see [Configuring](#configuring).

### Sub-Suites
Test suites can contain other test suites.

```ts
import { Test, Suite, SubSuite, TestSuite } from 'polymorphic-tests'

@Suite() class Calculator extends TestSuite {
  @Test() 'calculator exists'(t) {
    t.expect(calculate).to.be.an.instanceof(Function)
  }
}

@SubSuite(Calculator) class Add extends TestSuite {
  @Test() '3 + 3 = 6'(t) {
    t.expect(calculate('+', 3, 3)).to.equal(6)
  }
}

@SubSuite(Calculator) class Multiply extends TestSuite {
  @Test() '3 * 3 = 9'(t) {
    t.expect(calculate('*', 3, 3)).to.equal(9)
  }
}

function calculate(operation: string, x: number, y: number) {
  return eval(x + operation + y)
}
```

**Note that sub-suites still extend `TestSuite` and not their parent suites!** This is be explained below.

This is mostly useful for reporting and for test selection and filtering.

### Test Selection and Filtering

The `@Suite`, `@SubSuite`, and `@Test` decorators can all recieve as their last argument an options config with flags `skip` and `only`, e.g. `@Test({skip: true})`, `@SubSuite(MyParentSuite, {only: true})`.

The `only` flag **is not global**. This means decorating a test entity with it **only applies inside that entity's suite**. Currently there is no global only flag.

The `skip` flag skips the decorated test entity and any children it might have, taking complete priority over `only`.

So for example:
```ts
import { Test, Suite, SubSuite, TestSuite } from 'polymorphic-tests'

@Suite() class RootWithEntitiesWithFlags extends TestSuite {
  @Test() 'skipped because of sibling suite with only'(t) {}
}

@SubSuite(RootWithEntitiesWithFlags) class SkippedBecauseOfSiblingWithOnly extends TestSuite {}

@SubSuite(RootWithEntitiesWithFlags, {only: true}) class SuiteWithOnly extends TestSuite {
  @Test() 'runs normally'(t) {}
  @Test({skip: true}) 'still skipped'(t) {}
}

@Suite({skip: true}) class SkippedRoot extends TestSuite {}

@Suite() class UnaffectedRoot extends TestSuite {
  @Test() 'runs normally'(t) {}
}
```

#### Lifecycle Hooks
Every test suite exposes these hook methods for extending. It's good practice to always call `super.lifecycleHook()` when you override one of these.

*Note: hook methods may always return a promise to be awaited.*

```ts
import { Test, Suite, TestSuite } from 'polymorphic-tests'

@Suite() class MySuite extends TestSuite {
  static onDecorate() {
    // called when MySuite gets decorated
  }

  setup() {
    // called once when MySuite starts running
  }

  before(t) {
    // called before every test
  }

  @Test() 'some test'(t) {}

  after(t) {
    // called after every test
  }

  teardown() {
    // called once when MySuite ends
  }
}
```

**Hooks still run after a test fails**. This is important for cleanup purposes, but be aware that **if an error gets thrown during `after` and `teardown` it will be reported and your test error will be swallowed**.

### Extending `TestSuite`
Test suites being implemented as classes allows sharing all sorts of common boilerplate very easily through polymorphically implementing lifecycle hooks. For a full-fledged example of this, see [`polymorphic-web-component-tests`](../packages/polymorphic-web-component-tests).

Another use for extending `TestSuite` is inheriting tests, in addition to boilerplate.

```ts
import { Test, Suite, TestSuite } from 'polymorphic-tests'

abstract class CustomTestSuite extends TestSuite {
  abstract testString: string
  abstract expectedLength: number

  @Test() 'my test'(t) {
    t.expect(this.testString.length).to.equal(expectedLength)
  }
}
```

At this point, by design, no tests will run. This is because `CustomTestSuite` wasn't decorated with the `Suite` or `SubSuite` decorators for registration, so our test has no parent. This allows us to do this:

```ts
import { Test, Suite } from 'polymorphic-tests'
import { CustomTestSuite } from '...'

@Suite() class FirstSuite extends CustomTestSuite {
  testString = 'foo'
  expectedLength = 3
}

@Suite() class SecondSuite extends CustomTestSuite {
  testString = 'longer'
  expectedLength = 6
}
```

Note that here, `FirstSuite#my test` and `SecondSuite#my test` will run, but `CustomTestSuite#my test` will *never* run.

## Author

👤 **homunculus@wizard.enterprises**

* Github: [@wizard-enterprises](https://github.com/wizard-enterprises)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/wizard-enterprises/wizard-library/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2019 [homunculus@wizard.enterprises](https://github.com/wizard-enterprises).<br />
This project is [ISC](https://github.com/wizard-enterprises/wizard-library/blob/master/packages/polymorphic-tests/blob/master/LICENSE) licensed.
