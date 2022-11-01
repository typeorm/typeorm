import { PrimaryColumn, Entity, Column } from "../../../../src"

@Entity()
export class MysqlEntity {
    @PrimaryColumn()
    id: number

    @Column("time")
    fieldTime: string

    @Column("timestamp")
    fieldTimestamp: Date

    @Column("datetime")
    fieldDatetime: Date
}
