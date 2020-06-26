import { Column, Entity, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class Category {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Post, {
        cascade: true,
        onDelete: "SET NULL"
    })
    post?: Post | null | number;

    constructor(id: number, name: string, post?: Post) {
        this.id = id;
        this.name = name;
        if (post)
            this.post = post;
    }

}
