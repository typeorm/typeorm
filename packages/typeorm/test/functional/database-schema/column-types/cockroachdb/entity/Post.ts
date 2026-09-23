import {
    Column,
    Entity,
    GeometryCollection,
    LineString,
    MultiLineString,
    MultiPoint,
    MultiPolygon,
    Point,
    Polygon,
    PrimaryColumn,
} from "../../../../../../src"

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
    point: Point

    @Column("geometry")
    polygon: Polygon

    @Column("geometry")
    multipoint: MultiPoint

    @Column("geometry")
    linestring: LineString

    @Column("geometry")
    multilinestring: MultiLineString

    @Column("geometry")
    multipolygon: MultiPolygon

    @Column("geometry")
    geometrycollection: GeometryCollection

    // -------------------------------------------------------------------------
    // Geography Type
    // -------------------------------------------------------------------------

    @Column("geography")
    point_geography: Point

    @Column("geography")
    polygon_geography: Polygon

    @Column("geography")
    multipoint_geography: MultiPoint

    @Column("geography")
    linestring_geography: LineString

    @Column("geography")
    multilinestring_geography: MultiLineString

    @Column("geography")
    multipolygon_geography: MultiPolygon

    @Column("geography")
    geometrycollection_geography: GeometryCollection

    // -------------------------------------------------------------------------
    // UUID Type
    // -------------------------------------------------------------------------

    @Column("uuid")
    uuid: string

    // -------------------------------------------------------------------------
    // JSON Type
    // -------------------------------------------------------------------------

    @Column("jsonb")
    jsonb: object

    @Column("json")
    json: object

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
