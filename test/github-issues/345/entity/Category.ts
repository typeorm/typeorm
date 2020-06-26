import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    category_id: number;

    @Column()
    name: string;

    @ManyToMany(() => Post, post => post.categories)
    @JoinTable()
    posts: Post[];

}
