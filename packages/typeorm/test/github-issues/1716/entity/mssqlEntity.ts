import { PrimaryColumn, Entity, Column } from "../../../../src"

@Entity()
export class MssqlEntity {
    @PrimaryColumn()
    id: number

    @Column("time")
    fieldTime: Date

    @Column("datetime")
    fieldDatetime: Date

    @Column("datetime2")
    fieldDatetime2: Date

    @Column("datetimeoffset")
    fieldDatetimeoffset: Date
}
