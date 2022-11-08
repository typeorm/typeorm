import { DeleteDateColumn, OneToOne } from "../../../../src"
import { Column } from "../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { Three } from "./Three"
import { Two } from "./Two"

@Entity()
export class One {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne((type) => Two, (two) => two.one, {
        cascade: ["insert", "soft-remove"],
        orphanedRowAction: "soft-delete",
    })
    two: Two

    @OneToOne((type) => Three, (three) => three.one, {
        cascade: ["insert", "soft-remove"],
        orphanedRowAction: "soft-delete",
    })
    three: Three

    @Column({ type: "text" })
    text: string

    @DeleteDateColumn()
    deleted_at: string
}
