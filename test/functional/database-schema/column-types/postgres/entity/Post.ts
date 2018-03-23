import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    // -------------------------------------------------------------------------
    // Numeric Types
    // -------------------------------------------------------------------------

    @Column("integer")
    integer: number;

    @Column("int4")
    int4: number;

    @Column("int")
    int: number;

    @Column("smallint")
    smallint: number;

    @Column("int2")
    int2: number;

    @Column("bigint")
    bigint: string;

    @Column("int8")
    int8: string;

    /*@Column("serial")
    serial: number;

    @Column("serial4")
    serial4: number;

    @Column("smallserial")
    smallserial: number;

    @Column("serial2")
    serial2: number;

    @Column("bigserial")
    bigserial: number;

    @Column("serial8")
    serial8: number;*/

    @Column("numeric")
    numeric: string;

    @Column("decimal")
    decimal: string;

    @Column("double precision")
    doublePrecision: number;

    @Column("float8")
    float8: number;

    @Column("real")
    real: number;

    @Column("float4")
    float4: number;

    // -------------------------------------------------------------------------
    // Monetary Types
    // -------------------------------------------------------------------------

    @Column("money")
    money: string;

    // -------------------------------------------------------------------------
    // Character Types
    // -------------------------------------------------------------------------

    @Column("char")
    char: string;

    @Column("character")
    character: string;

    @Column("varchar")
    varchar: string;

    @Column("character varying")
    characterVarying: string;

    @Column("text")
    text: string;

    @Column("citext")
    citext: string;

    // -------------------------------------------------------------------------
    // Binary Data Types
    // -------------------------------------------------------------------------

    @Column("bytea")
    bytea: Buffer;

    // -------------------------------------------------------------------------
    // Date/Time Types
    // -------------------------------------------------------------------------

    @Column("date")
    date: string;

    @Column("interval")
    interval: any;

    @Column("time")
    time: string;

    @Column("time with time zone")
    timeWithTimeZone: string;

    @Column("timetz")
    timetz: string;

    @Column("timestamp")
    timestamp: Date;

    @Column("timestamp with time zone")
    timestampWithTimeZone: Date;

    @Column("timestamptz")
    timestamptz: Date;

    // -------------------------------------------------------------------------
    // Boolean Type
    // -------------------------------------------------------------------------

    @Column("boolean")
    boolean: boolean;

    @Column("bool")
    bool: boolean;

    // -------------------------------------------------------------------------
    // Enumerated Type
    // -------------------------------------------------------------------------

    /*@Column("enum", { enum: ["A", "B", "C"] })
    enum: string;*/

    // -------------------------------------------------------------------------
    // Geometric Type
    // -------------------------------------------------------------------------

    @Column("point")
    point: string|Object;

    @Column("line")
    line: string;

    @Column("lseg")
    lseg: string|string[];

    @Column("box")
    box: string|Object;

    @Column("path")
    path: string;

    @Column("polygon")
    polygon: string;

    @Column("circle")
    circle: string|Object;

    // -------------------------------------------------------------------------
    // Network Address Type
    // -------------------------------------------------------------------------

    @Column("cidr")
    cidr: string;

    @Column("inet")
    inet: string;

    @Column("macaddr")
    macaddr: string;

    // -------------------------------------------------------------------------
    // Bit String Type
    // -------------------------------------------------------------------------

    @Column("bit")
    bit: string;

    @Column("varbit")
    varbit: string;

    @Column("bit varying")
    bitVarying: string;

    // -------------------------------------------------------------------------
    // UUID Type
    // -------------------------------------------------------------------------

    @Column("uuid")
    uuid: string;

    // -------------------------------------------------------------------------
    // XML Type
    // -------------------------------------------------------------------------

    @Column("xml")
    xml: string;

    // -------------------------------------------------------------------------
    // JSON Type
    // -------------------------------------------------------------------------

    @Column("json")
    json: Object;

    // -------------------------------------------------------------------------
    // Array Type
    // -------------------------------------------------------------------------

    @Column("int", { isArray: true })
    array: number[];

    // -------------------------------------------------------------------------
    // TypeOrm Specific Types
    // -------------------------------------------------------------------------

    @Column("simple-array")
    simpleArray: string[];

    @Column("simple-json")
    simpleJson: { param: string };
}