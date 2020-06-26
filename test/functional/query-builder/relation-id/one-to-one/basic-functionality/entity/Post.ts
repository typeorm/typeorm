import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToOne(type => Category)
    @JoinColumn()
    category: Category;

    @OneToOne(type => Category, category => category.post)
    @JoinColumn()
    category2: Category;

    categoryId: number;

}
