// Pre-existing namespace-only type import must not be augmented with a
// named `DataSourceOptions` specifier — that produces invalid TS. The
// codemod should skip it and emit a fresh `import type { DataSourceOptions }`
// line instead, leaving the namespace import untouched.
import type * as Typeorm from "typeorm"
import type { SapConnectionOptions } from "typeorm"

export const makeOptions = (): SapConnectionOptions =>
    ({ type: "sap" }) as SapConnectionOptions

export type TopLevel = Typeorm.Connection
