import { Column, Entity, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    authorId: number;

    @Column()
    title: string;

    @Column()
    isRemoved: boolean = false;

    @ManyToOne(type => Category, category => category.posts)
    category: Category;

    @ManyToOne(type => Category)
    subcategory: Category;

    categoryId: number;

}
