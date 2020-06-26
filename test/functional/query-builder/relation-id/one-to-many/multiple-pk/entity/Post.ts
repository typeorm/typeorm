import { Column, Entity, OneToMany, PrimaryColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    authorId: number;

    @Column()
    title: string;

    @OneToMany(type => Category, category => category.post)
    categories: Category[];

    categoryIds: number[];

}
