import {Entity, ManyToOne, Column} from "../../../../src";
import {User} from "./User";
import {Post} from "./Post";

@Entity()
export class Comment {

    @ManyToOne(type => User, user => user.comments, {primary: true})
    user: User;

    @ManyToOne(type => Post, post => post.comments, {primary: true})
    post: Post;

    @Column()
    message: string;

}