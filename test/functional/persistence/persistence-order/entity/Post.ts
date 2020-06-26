import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";
import { Details } from "./Details";
import { Photo } from "./Photo";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToOne(type => Category, category => category.post, {
        nullable: true
    })
    @JoinColumn()
    category: Category;

    @OneToOne(type => Details, details => details.post, {
        nullable: false
    })
    @JoinColumn()
    details: Details;

    @OneToOne(type => Photo, photo => photo.post)
    photo: Photo;

}
