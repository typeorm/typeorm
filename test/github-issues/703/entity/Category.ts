import { Column, Entity, ManyToOne, PrimaryColumn, RelationId } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class Category {

    @PrimaryColumn()
    firstId: number;

    @PrimaryColumn()
    secondId: number;

    @Column()
    name: string;

    @ManyToOne(type => Post, post => post.categories)
    post: Post;

    @RelationId((category: Category) => category.post)
    postId: number;

}
