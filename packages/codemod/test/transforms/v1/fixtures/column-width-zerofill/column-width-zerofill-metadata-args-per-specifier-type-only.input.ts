import { type ColumnMetadata } from "typeorm"

// Per-specifier type-only import (`import { type X }`) — distinct from the
// declaration-level `import type { X }` form. Two guards must independently
// prevent the rewrite on the `new ColumnMetadata(...)` below: `valueOnly`
// filters the type-only specifier out of classLocalNames, and the scope walk
// finds the module-level `const ColumnMetadata` re-declaration. Either guard
// alone would block the rewrite; both pinning the correct behavior here.
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
