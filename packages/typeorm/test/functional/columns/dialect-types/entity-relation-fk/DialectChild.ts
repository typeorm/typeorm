import { Column } from "../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { JoinColumn } from "../../../../../src/decorator/relations/JoinColumn"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { DialectParent } from "./DialectParent"

@Entity("dialect_fk_child")
export class DialectChild {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ name: "parent_id", type: "int" })
    parentId: number

    @ManyToOne(() => DialectParent)
    @JoinColumn({ name: "parent_id" })
    parent: DialectParent

    @Column({
        name: "alternate_parent_id",
        type: "int",
        nullable: true,
        dialectTypes: { postgres: "integer" },
    })
    alternateParentId: number | null

    @ManyToOne(() => DialectParent, { nullable: true })
    @JoinColumn({ name: "alternate_parent_id" })
    alternateParent: DialectParent | null
}
