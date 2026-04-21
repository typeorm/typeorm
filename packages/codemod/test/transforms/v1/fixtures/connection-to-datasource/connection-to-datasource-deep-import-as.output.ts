import type { DataSourceOptions } from "typeorm"

declare const options: unknown

// `as SapConnectionOptions` — the deep-path import is dropped and the
// type reference is rewritten to `Extract<DataSourceOptions, { type: "sap" }>`
// so users only need the top-level `DataSourceOptions` union (the union
// narrows by `type` to the SAP-specific fields).
const { schema } = options as Extract<DataSourceOptions, { type: "sap" }>
