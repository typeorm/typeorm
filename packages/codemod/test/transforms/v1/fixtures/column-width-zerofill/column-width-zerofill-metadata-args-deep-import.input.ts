import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata"

// Deep sub-path import — the helper matches any module whose name equals
// `typeorm` or starts with `typeorm/`, so `typeorm/metadata/ColumnMetadata`
// is recognised as a runtime binding and the rewrite fires.
const col = new ColumnMetadata({
    args: { options: { width: 10, zerofill: true } },
})

export { col }
