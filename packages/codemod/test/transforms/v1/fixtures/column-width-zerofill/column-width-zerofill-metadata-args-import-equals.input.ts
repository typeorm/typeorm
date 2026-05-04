import typeorm = require("typeorm")

// TypeScript `import = require(...)` form — `typeorm` is a runtime value
// binding (never type-only), so the namespace-qualified `new typeorm.ColumnMetadata(...)`
// matches the namespace set and the rewrite fires.
const col = new typeorm.ColumnMetadata({
    args: { options: { width: 10, zerofill: true } },
})

export { col }
