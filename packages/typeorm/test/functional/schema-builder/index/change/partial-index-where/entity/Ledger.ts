import { Column, Entity, Index, PrimaryColumn } from "../../../../../../../src"

@Entity()
@Index("ledger_open", ["subject"], {
    where: `
        "ends_at" IS NULL`,
})
export class Ledger {
    @PrimaryColumn()
    id: number

    @Column()
    subject: string

    @Column({ name: "ends_at", type: "varchar", nullable: true })
    endsAt: string | null
}
