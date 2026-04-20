import type { SapDataSourceOptions } from "typeorm/driver/sap/SapDataSourceOptions"

declare const dataSource: any

// `as SapConnectionOptions` — the type reference downstream of the
// renamed import must be rewritten too, not just the import itself.
const { schema } = dataSource.options as SapDataSourceOptions
