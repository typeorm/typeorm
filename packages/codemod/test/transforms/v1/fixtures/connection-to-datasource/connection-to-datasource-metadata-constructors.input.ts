import { ColumnMetadata, EntityMetadata, IndexMetadata } from "typeorm"

declare const connection: any
declare const target: any
declare const args: any
declare const entityMetadata: any

// EntityMetadata: the constructor option was renamed `connection` → `dataSource`.
// Shorthand is expanded to a full key:value so the variable ref is preserved.
const ent1 = new EntityMetadata({ connection, target })
const ent2 = new EntityMetadata({ connection: connection, target })

// ColumnMetadata / IndexMetadata: the v0 `connection` option was removed —
// `dataSource` is now reached through `entityMetadata`, so the key is
// dropped.
const col = new ColumnMetadata({ connection, entityMetadata, args })
const idx = new IndexMetadata({ connection, entityMetadata, args })

// Non-TypeORM constructor of the same name must NOT be touched. A
// user-defined `EntityMetadata` class doesn't go through the typeorm import,
// so `connectionPropLocalNames` won't contain it.
class EntityMetadata2 {
    constructor(_opts: { connection: any }) {}
}
const custom = new EntityMetadata2({ connection })
