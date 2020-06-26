import { Column, Entity, OneToMany, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";


@Entity()
export class Category {

    @PrimaryColumn()
    categoryId: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.category)
    posts: Post[];

}
