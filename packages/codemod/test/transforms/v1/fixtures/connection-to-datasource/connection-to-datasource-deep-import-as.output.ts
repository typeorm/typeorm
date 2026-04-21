import type { SapDataSourceOptions } from "typeorm/driver/sap/SapDataSourceOptions"

declare const dataSource: any

// `as SapConnectionOptions` — the type reference downstream of the
// renamed import must be rewritten too, not just the import itself.
// The deep path is preserved (driver-specific options types aren't
// top-level exports from `"typeorm"`); only the identifier is renamed
// along with its containing filename segment.
const { schema } = dataSource.options as SapDataSourceOptions
