import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column("varchar", {
        length: 50
    })
    varchar: string;

    @Column("nvarchar", {
        length: 50
    })
    nvarchar: string;

    @Column("alphanum", {
        length: 50
    })
    alphanum: string;

    @Column("shorttext", {
        length: 50
    })
    shorttext: string;

    @Column("varbinary", {
        length: 50
    })
    varbinary: Buffer;

}
