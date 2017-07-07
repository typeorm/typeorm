import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";

@Entity()
export class PostWithOptions {

    @PrimaryColumn()
    id: string;

    // -------------------------------------------------------------------------
    // Numeric Types
    // -------------------------------------------------------------------------

    @Column("numeric", { precision: 5, scale: 2 })
    numeric: string;

    @Column("decimal", { precision: 5, scale: 2 })
    decimal: string;

    // -------------------------------------------------------------------------
    // Character Types
    // -------------------------------------------------------------------------

    @Column("char", { length: 3 })
    char: string;

    @Column("character", { length: 3 })
    character: string;

    @Column("varchar", { length: 30 })
    varchar: string;

    @Column("character varying", { length: 30 })
    characterVarying: string;

    // -------------------------------------------------------------------------
    // Date/Time Types
    // -------------------------------------------------------------------------

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

    @Column("timestamptz")
    timestamptz: Date;

    // -------------------------------------------------------------------------
    // UUID Type
    // -------------------------------------------------------------------------

    @Column("uuid")
    uuid: string;

}