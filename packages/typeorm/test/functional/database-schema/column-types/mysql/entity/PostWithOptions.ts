import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"

@Entity()
export class PostWithOptions {
    @PrimaryColumn()
    id: number

    @Column({ length: 10 })
    name: string

    @Column("float", { precision: 5, scale: 2 })
    float: number

    @Column("double", { precision: 5, scale: 2 })
    double: number

    @Column("decimal", { precision: 7, scale: 2 })
    decimal: string

    @Column("char", { length: 5 })
    char: string

    @Column("varchar", { length: 30 })
    varchar: string

    @Column("datetime", { precision: 6 })
    datetime: Date

    @Column("timestamp", { precision: 6 })
    timestamp: Date

    @Column("time", { precision: 3 })
    time: string
}
