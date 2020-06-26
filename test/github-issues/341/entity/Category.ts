import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    name: string;

    @OneToOne(type => Post, post => post.category)
    post: Post;

}
