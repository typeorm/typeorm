import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { OneToMany, ManyToOne, Column } from "../../../../src";

import { Blog } from "./Blog";
import { Comment } from "./Comment";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    blogId: number;
    
    @ManyToOne(type => Blog, blog => blog.posts, {
        onDelete: "CASCADE",
    })
    blog: Blog;

    @OneToMany(type => Comment, comment => comment.post, {
        cascade: true,
    })
    comments: Comment[];

    commentCount: number;
}
