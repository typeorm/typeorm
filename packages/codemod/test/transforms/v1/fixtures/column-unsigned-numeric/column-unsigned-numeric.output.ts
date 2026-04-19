import { Column } from "typeorm"

const column = Column("decimal", {
    precision: 10,
    scale: 2,
})

const numeric = Column({
    type: "numeric",
    precision: 8,
})

const untouched = Column({ type: "varchar", precision: 12, unsigned: true })
