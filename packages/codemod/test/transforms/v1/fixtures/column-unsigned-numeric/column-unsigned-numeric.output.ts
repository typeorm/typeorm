import { Column } from "typeorm"

const column = Column("decimal", {
    precision: 10,
    scale: 2,
})
