import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class MariadbEntity {

    @PrimaryColumn()
    id: number;

    @Column("time")
    fieldTime: Date;

    @Column("timestamp")
    fieldTimestamp: Date;

    @Column("datetime")
    fieldDatetime: Date;

}
