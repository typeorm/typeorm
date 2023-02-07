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

    @Column("dec", { precision: 10, scale: 2 })
    dec: string

    @Column("decimal", { precision: 10, scale: 3 })
    decimal: string

    // -------------------------------------------------------------------------
    // Character Types
    // -------------------------------------------------------------------------

    @Column("varchar", { length: 50 })
    varchar: string

    @Column("nvarchar", { length: 50 })
    nvarchar: string

    @Column("alphanum", { length: 50 })
    alphanum: string

    @Column("shorttext", { length: 50 })
    shorttext: string
}
