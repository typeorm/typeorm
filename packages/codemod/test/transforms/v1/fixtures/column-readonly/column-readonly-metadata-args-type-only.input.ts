import type { ColumnMetadata } from "typeorm"

// Type-only `ColumnMetadata` import does not create a runtime binding.
// The `const ColumnMetadata` below is the user's own runtime binding
// in value space (the type-only import lives only in type space).
// Without `valueOnly: true` filtering the type-only import out of the
// classLocalNames set, this would be rewritten — hence the fixture
// uses the *same* name as the import to actively exercise the guard.
type _Unused = ColumnMetadata

const ColumnMetadata = class {
    constructor(_opts: { args: { options: { readonly: boolean } } }) {}
}

const a = new ColumnMetadata({
    args: { options: { readonly: true } },
})

export { a }
