import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => Category, category => category.posts)
    category: Category;

}
