// Pre-existing namespace-only type import must not be augmented with a
// named `DataSourceOptions` specifier — that produces invalid TS. The
// codemod should skip it and emit a fresh `import type { DataSourceOptions }`
// line instead, leaving the namespace import untouched. `Typeorm.Connection`
// below is a `TSQualifiedName` in type position; the transform does not
// rewrite those, so it survives unchanged.
import type * as Typeorm from "typeorm"
import type { DataSourceOptions } from "typeorm"

export const makeOptions = (): Extract<DataSourceOptions, { type: "sap" }> =>
    ({
        type: "sap",
    }) as Extract<DataSourceOptions, { type: "sap" }>

export type TopLevel = Typeorm.Connection
