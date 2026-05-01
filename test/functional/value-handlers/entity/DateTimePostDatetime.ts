import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src"

@Entity()
export class DateTimePostDatetime {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: "date", nullable: true })
    dateOnly!: string | null

    @Column({ type: "datetime", nullable: true })
    fullDatetime!: Date | null

    @Column({ type: "time", nullable: true })
    timeOnly!: string | null
}
