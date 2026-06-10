const typeorm = require("typeorm")

// CommonJS namespace-style require — `const typeorm = require(...)` binds
// the whole module object to `typeorm`, so `new typeorm.ColumnMetadata(...)`
// is the runtime-equivalent of an ESM `import * as typeorm` call. The strip
// fires here just like the ESM namespace form.
const col = new typeorm.ColumnMetadata({
    args: { options: {} },
})

module.exports = { col }
