import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "@typeorm/core";
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

    @OneToOne(type => Category, category => category.post)
    @JoinColumn()
    category: Category;

    @OneToOne(type => Category)
    @JoinColumn()
    subcategory: Category;

    categoryId: number;

}
