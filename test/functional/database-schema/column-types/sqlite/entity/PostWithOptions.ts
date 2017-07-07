import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";

@Entity()
export class PostWithOptions {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    // -------------------------------------------------------------------------
    // Character Types
    // -------------------------------------------------------------------------

    @Column("character", { length: 20 })
    character: string;

    @Column("varchar", { length: 255 })
    varchar: string;

    @Column("varying character", { length: 255 })
    varyingCharacter: string;

    @Column("nchar", { length: 55 })
    nchar: string;

    @Column("native character", { length: 70 })
    nativeCharacter: string;

    @Column("nvarchar", { length: 100 })
    nvarchar: string;

    // -------------------------------------------------------------------------
    // Numeric Types
    // -------------------------------------------------------------------------

    @Column("decimal", { precision: 10, scale: 5 })
    decimal: number;

}