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

    @Column("integer")
    integer: string

    @Column("int4")
    int4: number

    @Column("int")
    int: string

    @Column("smallint")
    smallint: number

    @Column("int2")
    int2: number

    @Column("bigint")
    bigint: string

    @Column("int8")
    int8: string

    @Column("int64")
    int64: string

    @Column("double precision")
    doublePrecision: number

    @Column("float4")
    float4: number

    @Column("float8")
    float8: number

    @Column("real")
    real: number

    @Column("numeric")
    numeric: string

    @Column("decimal")
    decimal: string

    @Column("dec")
    dec: string

    // -------------------------------------------------------------------------
    // Character Types
    // -------------------------------------------------------------------------

    @Column("char")
    char: string

    @Column("character")
    character: string

    @Column("varchar")
    varchar: string

    @Column("character varying")
    characterVarying: string

    @Column("char varying")
    charVarying: string

    @Column("string")
    string: string

    @Column("text")
    text: string

    // -------------------------------------------------------------------------
    // Binary Data Types
    // -------------------------------------------------------------------------

    @Column("bytes")
    bytes: Buffer

    @Column("bytea")
    bytea: Buffer

    @Column("blob")
    blob: Buffer

    // -------------------------------------------------------------------------
    // Date/Time Types
    // -------------------------------------------------------------------------

    @Column("date")
    date: string

    @Column("interval")
    interval: any

    @Column("time")
    time: string

    @Column("time without time zone")
    timeWithoutTimeZone: string

    @Column("timestamp")
    timestamp: Date

    @Column("timestamp with time zone")
    timestampWithTimeZone: Date

    @Column("timestamp without time zone")
    timestampWithoutTimeZone: Date

    @Column("timestamptz")
    timestamptz: Date

    // -------------------------------------------------------------------------
    // Boolean Type
    // -------------------------------------------------------------------------

    @Column("boolean")
    boolean: boolean

    @Column("bool")
    bool: boolean

    // -------------------------------------------------------------------------
    // Network Address Type
    // -------------------------------------------------------------------------

    @Column("inet")
    inet: string

    // -------------------------------------------------------------------------
    // Geometry Type
    // -------------------------------------------------------------------------

    @Column("geometry")
    point: Object

    @Column("geometry")
    polygon: Object

    @Column("geometry")
    multipoint: Object

    @Column("geometry")
    linestring: Object

    @Column("geometry")
    multilinestring: Object

    @Column("geometry")
    multipolygon: Object

    @Column("geometry")
    geometrycollection: Object

    // -------------------------------------------------------------------------
    // Geography Type
    // -------------------------------------------------------------------------

    @Column("geography")
    point_geography: Object

    @Column("geography")
    polygon_geography: Object

    @Column("geography")
    multipoint_geography: Object

    @Column("geography")
    linestring_geography: Object

    @Column("geography")
    multilinestring_geography: Object

    @Column("geography")
    multipolygon_geography: Object

    @Column("geography")
    geometrycollection_geography: Object

    // -------------------------------------------------------------------------
    // UUID Type
    // -------------------------------------------------------------------------

    @Column("uuid")
    uuid: string

    // -------------------------------------------------------------------------
    // JSON Type
    // -------------------------------------------------------------------------

    @Column("jsonb")
    jsonb: Object

    @Column("json")
    json: Object

    // -------------------------------------------------------------------------
    // Array Type
    // -------------------------------------------------------------------------

    @Column("int", { array: true })
    array: string[]

    // -------------------------------------------------------------------------
    // TypeOrm Specific Types
    // -------------------------------------------------------------------------

    @Column("simple-array")
    simpleArray: string[]

    @Column("simple-json")
    simpleJson: { param: string }
}
