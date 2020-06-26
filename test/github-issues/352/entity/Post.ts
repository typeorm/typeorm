import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryColumn("double precision")
    id: number;

    @Column()
    title: string;

}
