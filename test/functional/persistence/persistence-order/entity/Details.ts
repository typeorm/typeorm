import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Post } from "./Post";
import { Photo } from "./Photo";

@Entity()
export class Details {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToOne(type => Post, post => post.details)
    post: Post;

    @OneToOne(type => Photo, photo => photo.details, {
        nullable: false
    })
    @JoinColumn()
    photo: Photo;

}
