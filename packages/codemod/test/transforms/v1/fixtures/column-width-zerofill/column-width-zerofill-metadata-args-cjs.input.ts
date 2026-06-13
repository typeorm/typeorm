const { ColumnMetadata } = require("typeorm")

// CommonJS destructured require is a runtime value binding — the rewrite
// should fire here. `valueOnly` doesn't apply to `require` (CJS has no
// type-only equivalent), so the match set includes this local.
const col = new ColumnMetadata({
    args: { options: { width: 10, zerofill: true } },
})

module.exports = { col }
