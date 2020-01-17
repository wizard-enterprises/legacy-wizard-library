import { Suite } from 'polymorphic-tests'
import { HydrationTests } from './hydratable.spec'
import { Hydratable } from '.'

class _SimpleHydratable extends Hydratable {
  protected static hydrate(number: string) {
    return new _SimpleHydratable(Number(number))
  }

  constructor(public number: Number) { super() }

  protected dehydrate() {
    return JSON.stringify(this.number)
  }
}

@Suite() class SimpleHydratable extends HydrationTests<_SimpleHydratable> {
  //@ts-ignore
  underTest = _SimpleHydratable
  hydrationSetups = this.makeSetupHydratables({
    'with 0': {
      hydratable(hydratable) { 
        hydratable.number = 0
        return hydratable
      },
    },
    'with 10': {
      hydratable(hydratable) { 
        hydratable.number = 10
        return hydratable
      },
    },
    'with 3.333': {
      hydratable(hydratable) { 
        hydratable.number = 3.333
        return hydratable
      },
    },
    'not with NaN': {
      shouldBeHydratable: false,
      hydratable(hydratable) { 
        hydratable.number = NaN
        return hydratable
      },
    },
  })
}