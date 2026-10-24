import { Column, Entity, Index, PrimaryColumn } from "../../../../../../../src"

@Entity()
@Index("habilitation_open", ["subject"], { where: `"ends_at" IS NULL` })
export class Habilitation {
    @PrimaryColumn()
    id: number

    @Column()
    subject: string

    @Column({ name: "ends_at", type: "varchar", nullable: true })
    endsAt: string | null
}
