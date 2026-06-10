import { Column } from "typeorm"

// Constant computed-string keys like `["unsigned"]: …` are statically
// knowable and must be stripped the same way as plain identifier keys.
const column = Column("decimal", {
    precision: 10,
    scale: 2,
    ["unsigned"]: true,
})

const numeric = Column({
    ["type"]: "numeric",
    precision: 8,
    ["unsigned"]: true,
})
