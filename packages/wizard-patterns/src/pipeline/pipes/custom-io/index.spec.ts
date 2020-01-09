import { SubSuite, Test } from 'polymorphic-tests'
import { Pipes, PipeSuite } from '../index.spec'
import { CustomIOPipe, CustomIOPipeFactoryResult } from '.'
import { TransformPipe } from '../transform'
import { ManualPipe } from '../manual'
import { PipeStatus } from '../..'

enum CustomIOType {
  type1, type2, type3,
}

class SimpleNumberIO implements CustomIOPipeFactoryResult {
  constructor(private doAsyncIO: boolean, private addToInput: number, private addToOutput: number) {}
  input(input) {
    return this.add(input, this.addToInput)
  }
  output(output) {
    return this.add(output, this.addToOutput)
  }
  private add(x, y, doAsyncIO = this.doAsyncIO) {
    return doAsyncIO
      ? new Promise(res => setTimeout(() => res(this.add(x, y, false)), 1))
      : x + y
  }
}

class TestCustomIOPipe extends CustomIOPipe<CustomIOType, number> {
  doAsyncIO: boolean

  factory(type) {
    switch (type) {
      case CustomIOType.type1: return new SimpleNumberIO(this.doAsyncIO, 100, -10)
      case CustomIOType.type2: return new SimpleNumberIO(this.doAsyncIO, 200, -20)
      case CustomIOType.type3: return new SimpleNumberIO(this.doAsyncIO, 300, -30)
    }
  }

  ioPipe = (x) =>
    this.doAsyncIO
      ? new Promise(res => setTimeout(() => res(x), 1))
      : x
}

@SubSuite(Pipes) class CustomIO extends PipeSuite<TestCustomIOPipe> {
  underTest = TestCustomIOPipe
  protected defaultType: CustomIOType
  protected asyncIO: boolean = false

  @Test() 'throw when no type or default type'(t) {
    t.expect(() => this.makePipe()).to.throw('custom IO pipe instantiated with no type or default type')
  }

  @Test() 'allow instantiation without type when default type specified'(t) {
    this.defaultType = CustomIOType.type1
    t.expect(() => this.makePipe()).not.to.throw()
  }

  @Test() 'do io by type'(t) {
    t.expect(this.makePipe(CustomIOType.type1).run(1)).to.equal(91)
    t.expect(this.makePipe(CustomIOType.type2).run(2)).to.equal(182)
    t.expect(this.makePipe(CustomIOType.type3).run(3)).to.equal(273)
  }

  @Test() async 'do async io'(t) {
    this.asyncIO = true
    let runProm = this.makePipe(CustomIOType.type1).run(1)
    t.expect(runProm).to.be.an.instanceof(Promise)
    t.expect(await runProm).to.equal(91)
  }

  @Test() 'set wrapped pipe externally'(t) {
    let pipe = this.makePipe(CustomIOType.type1)
    pipe.ioPipe = new TransformPipe(x => x + 8)
    t.expect(pipe.run(1)).to.equal(99)
  }

  @Test() async 'pipe correctly tracks created pipe status'(t) {
    let pipe = this.makePipe(CustomIOType.type1),
      manualPipe = pipe.ioPipe = new ManualPipe
    t.expect(pipe.status).to.equal(PipeStatus.unassembled)
    let runProm = pipe.run(1) as Promise<number>
    t.expect(pipe.status).to.equal(PipeStatus.piping)
    await manualPipe.next(manualPipe.input)
    t.expect(pipe.status).to.equal(PipeStatus.piped)
    t.expect(await runProm).to.equal(91)
  }

  makeUnderTestPipe(...pipeArgs) {
    let unsetDefaultTypeSymbol = Symbol('unset default type'),
      oldDefaultType: any = unsetDefaultTypeSymbol
    if (this.defaultType !== undefined) {
      oldDefaultType = TestCustomIOPipe.prototype.defaultType
      TestCustomIOPipe.prototype.defaultType = this.defaultType
    }
    TestCustomIOPipe.prototype.doAsyncIO = this.asyncIO
    //@ts-ignore
    let pipe = super.makeUnderTestPipe(...pipeArgs)
    if (oldDefaultType !== unsetDefaultTypeSymbol)
      TestCustomIOPipe.prototype.defaultType = oldDefaultType
    return pipe
  }
}