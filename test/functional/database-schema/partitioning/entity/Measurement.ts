import { Entity, PrimaryColumn, Column } from "../../../../../src"

@Entity({
    name: "measurement",
    partition: {
        type: "RANGE",
        columns: ["logdate"],
    },
})
export class Measurement {
    @PrimaryColumn()
    id: number

    @PrimaryColumn("date")
    logdate: Date

    @Column("float")
    value: number

    @Column()
    sensor: string
}
