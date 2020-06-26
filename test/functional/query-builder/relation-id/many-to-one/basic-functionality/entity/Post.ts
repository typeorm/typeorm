import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";
import { PostCategory } from "./PostCategory";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => Category)
    @JoinColumn({referencedColumnName: "name"})
    categoryByName: Category;

    @ManyToOne(type => Category)
    @JoinColumn()
    category: Category;

    @OneToMany(type => PostCategory, postCategoryRelation => postCategoryRelation.post)
    categories: PostCategory[];

    categoryId: number;

    categoryName: string;

}
