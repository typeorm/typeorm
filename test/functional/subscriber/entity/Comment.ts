import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { ManyToOne, Column } from "../../../../src";

import { Post } from "./Post";

@Entity()
export class Comment {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    postId: number;

    @ManyToOne(type => Post, post => post.comments, {
        onDelete: "CASCADE",
    })
    post: Post;
}
