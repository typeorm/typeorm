import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Category {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    postText: string;

    @Column()
    postTag: string;

}
