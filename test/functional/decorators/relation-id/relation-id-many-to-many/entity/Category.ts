import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn, RelationId } from "@typeorm/core";
import { Post } from "./Post";
import { Image } from "./Image";

@Entity()
export class Category {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    isRemoved: boolean = false;

    @ManyToMany(type => Post, post => post.categories)
    posts: Post[];

    @ManyToMany(type => Image)
    @JoinTable()
    images: Image[];

    @RelationId((category: Category) => category.images)
    imageIds: number[];

    @RelationId((category: Category) => category.images, "removedImages", qb => qb.andWhere("removedImages.isRemoved = :isRemoved", {isRemoved: true}))
    removedImageIds: number[];

    @RelationId((category: Category) => category.posts)
    postIds: number[];

    @RelationId((category: Category) => category.posts, "removedPosts", qb => qb.andWhere("removedPosts.isRemoved = :isRemoved", {isRemoved: true}))
    removedPostIds: number[];

}
