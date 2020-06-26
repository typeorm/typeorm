import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    constructor(id: number, title: string) {
        this.id = id;
        this.title = title;
    }

}
