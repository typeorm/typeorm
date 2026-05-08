import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class PlainPost {
    @PrimaryGeneratedColumn() id!: number

    @Column({ type: "timestamp", temporal: true })
    happenedAt!: any

    @Column({ type: "date", temporal: true })
    onDate!: any

    @Column({ type: "time", temporal: true })
    atTime!: any
}
