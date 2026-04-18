import { Column } from "typeorm"

const column = Column("decimal", { precision: 10, scale: 2, unsigned: true })

const numeric = Column({ type: "numeric", precision: 8, unsigned: true })

const untouched = Column({ type: "varchar", precision: 12, unsigned: true })
