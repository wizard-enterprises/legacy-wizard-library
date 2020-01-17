import { TestSuite } from 'polymorphic-tests'
import { Hydratable } from '.'

interface HydratableCollection<CollectionType> {
  [key: string]: {
    hydratable: CollectionType,
    shouldBeHydratable?: boolean,
  },
}
type HydratableSetup<UnderTest> = (underTest: UnderTest) => UnderTest | Promise<UnderTest>
type HydratableSetups<UnderTest> = HydratableCollection<HydratableSetup<UnderTest>>
type SetupHydratable<UnderTest> = {
  hydratable: UnderTest,
  shouldBeHydratable: boolean,
}
type SetupHydratables<UnderTest> = HydratableCollection<SetupHydratable<UnderTest>>

export abstract class HydrationTests<UnderTest extends Hydratable> extends TestSuite {
  abstract underTest: new () => UnderTest
  abstract hydrationSetups: HydratableSetups<UnderTest>
  protected shouldBeHydratable: boolean = true

  protected makeSetupHydratables(setupHydratables: HydratableSetups<UnderTest>) {
    return Object.entries(setupHydratables).reduce((acc, [description, hydratable]) => {
      this.shouldBeHydratable = true
      return {
        ...acc,
        [description]: {
          hydratable: hydratable.hydratable.call(this, this.makeHydratable()),
          shouldBeHydratable: this.shouldBeHydratable,
        },
      }
    }, {})
  }

  protected createTests(createTest: Function) {
    for (let [description, {hydratable, shouldBeHydratable}] of Object.entries(this.hydrationSetups))
      createTest(description, t => this.testHydratability(t, hydratable, shouldBeHydratable))  
  }

  protected testHydratability(t, hydratable, shouldBeHydratable) {
    let dehydrated = hydratable.toString(),
      derehydrated = hydratable.constructor.fromString(dehydrated).toString()
    shouldBeHydratable
      ? t.expect(dehydrated).to.equal(derehydrated)
      : t.expect(dehydrated).not.to.equal(derehydrated)
  }

  protected makeHydratable() {
    return new this.underTest() as UnderTest
  }
}

