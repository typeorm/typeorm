import type { SapConnectionOptions } from "typeorm/driver/sap/SapConnectionOptions"

declare const dataSource: any

// `as SapConnectionOptions` — the type reference downstream of the
// renamed import must be rewritten too, not just the import itself.
const { schema } = dataSource.options as SapConnectionOptions
