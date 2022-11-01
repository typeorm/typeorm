import { PrimaryColumn, Entity, Column } from "../../../../src"

@Entity()
export class PgEntity {
    @PrimaryColumn()
    id: number

    @Column("time")
    fieldTime: string

    @Column("time with time zone")
    fieldTimeWithTZ: string

    @Column("time without time zone")
    fieldTimeWithoutTZ: string

    @Column("timestamp")
    fieldTimestamp: Date

    @Column("timestamp without time zone")
    fieldTimestampWithoutTZ: Date

    @Column("timestamp with time zone")
    fieldTimestampWithTZ: Date
}
