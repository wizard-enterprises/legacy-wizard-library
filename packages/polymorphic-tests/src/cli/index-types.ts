import { TestReporterType } from "../core/reporters"

type UnnestedSetupConfig = Function | string
interface NestedSetupConfig extends Array<NestedSetupConfig | UnnestedSetupConfig> {}
type SetupConfig = NestedSetupConfig | UnnestedSetupConfig

export interface PolytestConfig {
  reporter: TestReporterType
  timeout: number,
  tests: string[]
  codes: string[]
  setup: SetupConfig
}

export type CliOptionOverrides = Partial<PolytestConfig>

export const defaultConfig: PolytestConfig = {
  reporter: TestReporterType.simple,
  timeout: 2000,
  tests: [
    `(src|app|lib|build|dist)/**/*.(spec|test).js`,
    `(src|app|lib|build|dist)/**/__tests__/**/*.js`
  ],
  codes: [
    `(src|app|lib|build|dist)/**/*.js`,
    `!(src|app|lib|build|dist)/**/*.(spec|test).js`,
  ],
  setup: [],
}