import { Column, Entity, Index, PrimaryColumn } from "../../../../../../../src"

@Entity()
@Index("membership_subject", ["subject"])
export class Membership {
    @PrimaryColumn()
    id: number

    @Column()
    subject: string

    @Column({ name: "ends_at", type: "varchar", nullable: true })
    endsAt: string | null
}
