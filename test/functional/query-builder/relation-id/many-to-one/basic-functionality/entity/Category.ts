import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { PostCategory } from "./PostCategory";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    name: string;

    @OneToMany(type => PostCategory, postCategory => postCategory.category)
    posts: PostCategory[];

}
