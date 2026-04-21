import type { DataSourceOptions } from "typeorm"

declare const dataSource: any

// `as SapConnectionOptions` — the deep-path import is dropped and the
// type reference is rewritten to `Extract<DataSourceOptions, { type: "sap" }>`
// so users only need the top-level `DataSourceOptions` union (the union
// narrows by `type` to the SAP-specific fields).
const { schema } = dataSource.options as Extract<
    DataSourceOptions,
    { type: "sap" }
>
