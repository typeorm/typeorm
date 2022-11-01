import { PrimaryColumn, Entity, Column } from "../../../../src"

@Entity()
export class PostgresEntity {
    @PrimaryColumn()
    id: number

    @Column("time")
    fieldTime: string

    @Column("time with time zone")
    fieldTimeWithTimeZone: string

    @Column("time without time zone")
    fieldTimeWithoutTimeZone: string

    @Column("timestamp")
    fieldTimestamp: Date

    @Column("timestamp without time zone")
    fieldTimestampWithoutTimeZone: Date

    @Column("timestamp with time zone")
    fieldTimestampWithTimeZone: Date
}
