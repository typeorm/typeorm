import { Entity, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class Category {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    name: string;

    @ManyToOne(type => Post, post => post.counters.categories)
    post: Post;

}
