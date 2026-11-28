import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class EventLog {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: "varchar" })
    category: string

    @Column({ type: "varchar", nullable: true })
    code?: string | null

    @Column({ type: "datetime", nullable: true })
    occurredAt?: Date | string | null
}
