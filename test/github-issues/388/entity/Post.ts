import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryColumn({name: "bla_id"})
    lala_id: string;

    @Column()
    title: string;

    @Column({name: "my_index"})
    index: number;

}
