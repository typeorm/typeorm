import { Column, Entity, Generated, OneToMany, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";


@Entity()
export class Category {

    @PrimaryColumn("int")
    @Generated()
    categoryId: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.category)
    posts: Post[];

}
