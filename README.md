# wizard-library
Monorepo of all non-secretive wizard tooling and other various enterprising.

## Packages
- [polymorphic-tests](packages/polymorphic-tests) - Polymorphic test framework for JS by Wizard Enterprises.
- [polymorphic-web-component-tests](packages/polymorphic-web-component-tests) - Abstract test suite with tooling for testing custom web components.
- [wizard-components](packages/wizard-components)
  - [element](packages/wizard-components/element) - Abstract element class (mostly just to wrap LitElement).
  - [expanding-list](packages/wizard-components/expanding-list) - Simple list with configurable item input.
  - [pipeline](packages/wizard-components/pipeline) - Components for representing and running through wizard pipes.
- [wizard-decorators](packages/wizard-decorators) - Easy and convenient typing and tooling for JS/TS decorator creation.
- [wizard-patterns](packages/wizard-patterns)
  - [composable-function](packages/wizard-patterns/composable-function) - Easy and convenient tooling for composing functions with function properties.
  - [hydratable](packages/wizard-patterns/hydratable) - wip
  - [pipe](packages/wizard-patterns/pipe) - Modular logical data IO pipes and pipelines.
  - [state-machine](packages/wizard-patterns/state-machine) - Simple class-based tooling for the definition and implementation of state machines.
- [wizard-utils](packages/wizard-utils) - Various utilities used by other packages.