import { Entity, PrimaryColumn, Column } from "../../../../../src"

@Entity()
export class DayDemand {
    @PrimaryColumn("uuid")
    id: string

    @Column({ type: "date" })
    date: string
}
