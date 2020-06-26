import { Column, Entity, JoinTable, ManyToOne, OneToMany, PrimaryColumn } from "@typeorm/core";
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

    @OneToMany(type => Post, post => post.category)
    posts: Post[];

    @ManyToOne(type => Image, image => image.categories)
    @JoinTable()
    image: Image;

    postIds: number[];

    imageId: number[];

}
