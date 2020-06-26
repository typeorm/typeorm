import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("character", {
        length: 50
    })
    character: string;

    @Column("varchar", {
        length: 50
    })
    varchar: string;

    @Column("varying character", {
        length: 50
    })
    varying_character: string;

    @Column("nchar", {
        length: 50
    })
    nchar: string;

    @Column("native character", {
        length: 50
    })
    native_character: string;

    @Column("nvarchar", {
        length: 50
    })
    nvarchar: string;

}
