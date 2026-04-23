import { type ColumnMetadata } from "typeorm"

// Per-specifier type-only import (`import { type X }`) — distinct from the
// declaration-level `import type { X }` form. `valueOnly: true` must filter
// this specifier out of classLocalNames, so the runtime `const ColumnMetadata`
// below stays untouched and the rewrite must NOT fire.
type _Unused = ColumnMetadata

const ColumnMetadata = class {
    constructor(_opts: {
        args: { options: { width: number; zerofill: boolean } }
    }) {}
}

const a = new ColumnMetadata({
    args: { options: { width: 10, zerofill: true } },
})

export { a }
