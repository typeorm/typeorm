import { DeleteDateColumn, JoinColumn, OneToOne } from "../../../../src"
import { Column } from "../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { Three } from "./Three"
import { Two } from "./Two"

@Entity()
export class One {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ name: "two_id" })
    twoId: number

    @Column({ name: "three_id" })
    threeId: number

    @OneToOne((type) => Two, (two) => two.one, {
        cascade: ["insert", "soft-remove"],
        orphanedRowAction: "soft-delete",
    })
    @JoinColumn({ name: "two_id" })
    two: Two

    @OneToOne((type) => Three, (three) => three.one, {
        cascade: ["insert", "soft-remove"],
        orphanedRowAction: "soft-delete",
    })
    @JoinColumn({ name: "three_id" })
    three: Three

    @Column({ type: "text", nullable: true })
    text: string

    @DeleteDateColumn()
    deleted_at: string
}
