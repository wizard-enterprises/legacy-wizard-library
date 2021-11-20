# Wizard Decorators
This project was written to facilitate implementing decorators (whether through [Typescript] or through [Babel]) in a way that's readable,
maintainable, and allows the programmer to compartmentalize shared functionality between multiple decoratables (e.g. functions, methods, classes, et al.).

**Note:** decorator syntax is experimental and pending the [ECMAScript decorators] proposal, currently in stage 2 and lacking a finalized syntax. As always,
until that proposal is part of the language, don't use decorators if you're not ready for things to change and break once it is, at long last, finalized.

## Usage & Comparison
Wizard Decorators are built using classes, like so:
```js
import { Decorator, DecorateeType as Type } from 'wizard-decorators'


```

[Typescript]: [https://www.typescriptlang.org/docs/handbook/decorators.html]
[Babel]: [https://babeljs.io/docs/en/babel-plugin-proposal-decorators]
[ECMAScript decorators]: [https://github.com/tc39/proposal-decorators]