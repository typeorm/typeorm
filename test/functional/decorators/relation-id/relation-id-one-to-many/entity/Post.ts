import { Column, Entity, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    isRemoved: boolean = false;

    @ManyToOne(type => Category)
    category: Category;

    categoryId: number;

}
