import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Post, post => post.categories)
    post: Post;

}
