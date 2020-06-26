import { Column, Entity, Generated, OneToMany, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class Category {

    @PrimaryColumn({name: "theId"})
    @Generated()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.category, {
        cascade: ["insert"]
    })
    posts: Post[];

}
