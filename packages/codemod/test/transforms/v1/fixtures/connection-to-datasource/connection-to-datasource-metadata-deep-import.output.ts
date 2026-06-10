import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata"
import { IndexMetadata } from "typeorm/metadata/IndexMetadata"
import { EntityMetadata } from "typeorm/metadata/EntityMetadata"

declare const connection: any
declare const target: any
declare const args: any
declare const entityMetadata: any

// Deep-path imports of metadata types (`"typeorm/metadata/…"`) should still
// trigger the constructor-options rewrite — the v0 `.connection` option was
// removed in v1 on ColumnMetadata/IndexMetadata and renamed on EntityMetadata.
const col = new ColumnMetadata({
    entityMetadata,
    args,
})
const idx = new IndexMetadata({
    entityMetadata,
    args,
})
const ent = new EntityMetadata({ dataSource: connection, target })
