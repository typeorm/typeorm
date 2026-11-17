import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class Schedule {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column("date", { array: true, nullable: true, select: false })
    days: string[] | null

    @Column("time", { array: true, nullable: true, select: false })
    hours: string[] | null

    @Column("timestamp", { array: true, nullable: true, select: false })
    moments: Date[] | null
}
