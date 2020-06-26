import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from "@typeorm/core";
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

    @ManyToMany(type => Category, category => category.posts)
    @JoinTable()
    categories: Category[];

    @ManyToMany(type => Category)
    @JoinTable()
    subcategories: Category[];

    categoryIds: number[];

}
