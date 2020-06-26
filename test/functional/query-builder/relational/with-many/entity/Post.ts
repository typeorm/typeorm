import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";
import { Image } from "./Image";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => Category, category => category.posts)
    category: Category;

    @ManyToMany(type => Image, image => image.posts)
    @JoinTable()
    images: Image[];

}
