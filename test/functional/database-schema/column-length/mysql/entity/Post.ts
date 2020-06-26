import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column("char", {
        length: 50
    })
    char: string;

    @Column("varchar", {
        length: 50
    })
    varchar: string;

}
