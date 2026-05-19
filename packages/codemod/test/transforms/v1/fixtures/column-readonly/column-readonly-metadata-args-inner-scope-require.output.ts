// CJS requires only count as TypeORM bindings when declared at module scope.
// The destructure below lives inside a function; the collector skips it so
// the scope guard and the binding source stay consistent. Users who want
// their inside-function requires rewritten should hoist them to top level.
function makeCol() {
    const { ColumnMetadata } = require("typeorm")
    return new ColumnMetadata({
        args: { options: { readonly: true } },
    })
}

// Same shape but for the namespace form — also not collected.
function makeColNamespaced() {
    const typeorm = require("typeorm")
    return new typeorm.ColumnMetadata({
        args: { options: { readonly: true } },
    })
}

module.exports = { makeCol, makeColNamespaced }
