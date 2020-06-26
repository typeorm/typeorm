import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column("character varying", {
        length: 50
    })
    characterVarying: string;

    @Column("varchar", {
        length: 50
    })
    varchar: string;

    @Column("character", {
        length: 50
    })
    character: string;

    @Column("char", {
        length: 50
    })
    char: string;

}
