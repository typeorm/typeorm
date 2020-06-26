import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";
import { Image } from "./Image";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => Category)
    category: Category;

    @OneToOne(type => Image, image => image.post)
    @JoinColumn()
    image: Image;

}
