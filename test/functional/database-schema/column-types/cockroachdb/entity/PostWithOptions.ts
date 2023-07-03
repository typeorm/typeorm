import { Entity } from "../../../../../../src"
import { PrimaryColumn } from "../../../../../../src"
import { Column } from "../../../../../../src"

@Entity()
export class PostWithOptions {
    @PrimaryColumn()
    id: number

    // -------------------------------------------------------------------------
    // Numeric Types
    // -------------------------------------------------------------------------

    @Column("numeric", { precision: 5, scale: 2 })
    numeric: string

    @Column("decimal", { precision: 5, scale: 2 })
    decimal: string

    @Column("dec", { precision: 5, scale: 2 })
    dec: string

    // -------------------------------------------------------------------------
    // Character Types
    // -------------------------------------------------------------------------

    @Column("char", { length: 3 })
    char: string

    @Column("character", { length: 3 })
    character: string

    @Column("varchar", { length: 30 })
    varchar: string

    @Column("character varying", { length: 30 })
    characterVarying: string

    @Column("char varying", { length: 30 })
    charVarying: string

    @Column("string", { length: 30 })
    string: string
}
