import { Column, Entity, OneToOne, PrimaryColumn, RelationId } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class Category {

    @PrimaryColumn()
    id: number;

    @Column({unique: true})
    name: string;

    @OneToOne(type => Post, post => post.category2)
    post: Post;

    @RelationId((category: Category) => category.post)
    postId: number;

}
