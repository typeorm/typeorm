import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { VersionColumn } from "../../../../../src/decorator/columns/VersionColumn"

@Entity({
    name: "event",
})
export class Event {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "date" })
    localDate: Date

    @Column({ type: "date", utc: true })
    utcDate: Date

    @Column({
        type: "date",
        utc: true,
        nullable: true,
        transformer: {
            from: (value: string | null) =>
                value === null ? null : new Date(value),
            to: (value: Date | null) => value,
        },
    })
    utcTransformedDate: Date | null

    @VersionColumn()
    version: number
}
