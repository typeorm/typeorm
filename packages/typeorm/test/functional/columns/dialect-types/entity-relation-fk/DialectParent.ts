import { Column } from "../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../src/decorator/columns/PrimaryColumn"

@Entity("dialect_fk_parent")
export class DialectParent {
    @PrimaryColumn({
        type: "tinyint",
        dialectTypes: { postgres: "smallint" },
    })
    id: number

    @Column({ type: "varchar", length: 40 })
    name: string
}
