import { Column, Entity, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryColumn()
    firstId: number;

    @PrimaryColumn()
    secondId: number;

    @Column()
    title: string;

    @ManyToOne(type => Category, category => category.posts)
    category: Category;

}
