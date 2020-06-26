import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";
import { Image } from "./Image";

@Entity()
export class Category {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    code: number;

    @Column()
    name: string;

    @Column()
    isRemoved: boolean = false;

    @OneToOne(type => Post, post => post.category)
    post: Post;

    @OneToOne(type => Image, image => image.category)
    @JoinColumn()
    image: Image;

    postId: number;

    imageId: number;

}
