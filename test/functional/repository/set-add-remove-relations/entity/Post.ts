import { Category } from "./Category";
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToMany(type => Category, category => category.post)
    categories: Category[] | null;

    @ManyToMany(type => Category, category => category.manyPosts)
    @JoinTable()
    manyCategories: Category[];

}
