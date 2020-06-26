import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Post } from "./Post";
import { Details } from "./Details";
import { Category } from "./Category";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Details, details => details.photo)
    details: Details;

    @OneToOne(type => Post, post => post.photo, {
        nullable: false
    })
    @JoinColumn()
    post: Post;

    @OneToOne(type => Category, {
        nullable: false
    })
    @JoinColumn()
    category: Category;

}
