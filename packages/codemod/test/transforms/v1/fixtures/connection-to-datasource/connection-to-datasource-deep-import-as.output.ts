import type { SapDataSourceOptions } from "typeorm"

declare const dataSource: any

// `as SapConnectionOptions` — the type reference downstream of the
// renamed import must be rewritten too, not just the import itself.
// The deep path collapses to the shallow `"typeorm"` index import since
// `SapDataSourceOptions` is re-exported from the package index in v1.
const { schema } = dataSource.options as SapDataSourceOptions
