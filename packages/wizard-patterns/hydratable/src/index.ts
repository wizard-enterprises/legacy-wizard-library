export abstract class Hydratable {
  static fromString(dehydrated: string): Hydratable {
    return this.hydrate(dehydrated)
  }
  protected static hydrate(dehydrated: string): Hydratable { throw new Error('Not implemented') }

  toString(): string {
    return this.dehydrate()
  }

  protected abstract dehydrate()
}

export abstract class JSONHydratable extends Hydratable {
  static fromString(dehydrated: string) {
    return super.fromString(JSON.parse(dehydrated))
  }

  toString() {
    return JSON.stringify(super.toString())
  }
}