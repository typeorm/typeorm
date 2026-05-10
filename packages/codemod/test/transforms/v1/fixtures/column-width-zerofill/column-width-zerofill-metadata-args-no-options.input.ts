import { ColumnMetadata } from "typeorm"

// `args` has no `options` key — the helper's inner `findObjectPropertyValue`
// returns null and the callback is never invoked. Nothing to rewrite.
const col = new ColumnMetadata({
    args: {
        target: "A",
        mode: "regular",
        propertyName: "a",
    },
})

export { col }
