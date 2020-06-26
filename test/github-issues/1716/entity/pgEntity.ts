import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class PgEntity {

    @PrimaryColumn()
    id: number;

    @Column("time")
    fieldTime: Date;

    @Column("time with time zone")
    fieldTimeWithTZ: Date;

    @Column("time without time zone")
    fieldTimeWithoutTZ: Date;

    @Column("timestamp")
    fieldTimestamp: Date;

    @Column("timestamp without time zone")
    fieldTimestampWithoutTZ: Date;

    @Column("timestamp with time zone")
    fieldTimestampWithTZ: Date;

}
