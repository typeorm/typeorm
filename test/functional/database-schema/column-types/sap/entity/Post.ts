import { Entity } from "../../../../../../src"
import { PrimaryColumn } from "../../../../../../src"
import { Column } from "../../../../../../src"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    // -------------------------------------------------------------------------
    // Numeric Types
    // -------------------------------------------------------------------------

    @Column("int")
    int: number

    @Column("integer")
    integer: number

    @Column("tinyint")
    tinyint: number

    @Column("smallint")
    smallint: number

    @Column("bigint")
    bigint: string

    @Column("decimal")
    decimal: string

    @Column("dec")
    dec: string

    @Column("smalldecimal")
    smalldecimal: string

    @Column("real")
    real: number

    @Column("double")
    double: number

    @Column("float")
    float: number

    // -------------------------------------------------------------------------
    // Character Types
    // -------------------------------------------------------------------------

    @Column("char")
    char: string

    @Column("nchar")
    nchar: string

    @Column("varchar")
    varchar: string

    @Column("nvarchar")
    nvarchar: string

    @Column("alphanum")
    alphanum: string

    @Column("text")
    text: string

    @Column("shorttext")
    shorttext: string

    // -------------------------------------------------------------------------
    // Date Types
    // -------------------------------------------------------------------------

    @Column("date")
    dateObj: Date

    @Column("date")
    date: string

    @Column("time")
    timeObj: Date

    @Column("time")
    time: string

    @Column("timestamp")
    timestamp: Date

    @Column("seconddate")
    seconddate: Date

    // -------------------------------------------------------------------------
    // LOB Type
    // -------------------------------------------------------------------------

    @Column("blob")
    blob: Buffer

    @Column("clob")
    clob: string

    @Column("nclob")
    nclob: string

    // -------------------------------------------------------------------------
    // Other Type
    // -------------------------------------------------------------------------

    @Column("boolean")
    boolean: boolean

    // @Column("varchar", { array: true })
    // array: string[];

    @Column("varbinary")
    varbinary: Buffer

    // -------------------------------------------------------------------------
    // TypeOrm Specific Type
    // -------------------------------------------------------------------------

    @Column("simple-array")
    simpleArray: string[]
}
