import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"

@Entity()
export class PostWithOptions {
    @PrimaryColumn()
    id: number

    // -------------------------------------------------------------------------
    // Numeric Types
    // -------------------------------------------------------------------------

    @Column("number", { precision: 10, scale: 5 })
    number: number

    @Column("numeric", { precision: 10, scale: 5 })
    numeric: number

    @Column("dec", { precision: 10, scale: 5 })
    dec: number

    @Column("decimal", { precision: 10, scale: 5 })
    decimal: number

    @Column("float", { precision: 24 })
    float: number

    // -------------------------------------------------------------------------
    // Character Types
    // -------------------------------------------------------------------------

    @Column("char", { length: 3 })
    char: string

    @Column("nchar", { length: 3 })
    nchar: string

    @Column("varchar2", { length: 50 })
    varchar2: string

    @Column("nvarchar2", { length: 40 })
    nvarchar2: string

    @Column("raw", { length: 500 })
    raw: Buffer

    // -------------------------------------------------------------------------
    // Date Types
    // -------------------------------------------------------------------------

    @Column("timestamp", { precision: 5 })
    timestamp: Date

    @Column("timestamp with time zone", { precision: 6 })
    timestampWithTimeZone: Date

    @Column("timestamp with local time zone", { precision: 7 })
    timestampWithLocalTimeZone: Date
}
