import { Entity, ManyToMany, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class Category {

    @PrimaryColumn({collation: "ascii_general_ci", charset: "ascii"})
    id: string;

    @ManyToMany(type => Post, post => post.categories)
    posts: Post[];

}
