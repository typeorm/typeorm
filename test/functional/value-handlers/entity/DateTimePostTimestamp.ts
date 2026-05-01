import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src"

@Entity()
export class DateTimePostTimestamp {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: "date", nullable: true })
    dateOnly!: string | null

    @Column({ type: "timestamp", nullable: true })
    fullDatetime!: Date | null

    @Column({ type: "time", nullable: true })
    timeOnly!: string | null
}
