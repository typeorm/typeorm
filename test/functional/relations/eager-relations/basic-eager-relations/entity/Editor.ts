import { Entity, JoinColumn, ManyToOne, OneToOne } from "@typeorm/core";
import { User } from "./User";
import { Post } from "./Post";

@Entity()
export class Editor {

    @OneToOne(type => User, {eager: true, primary: true})
    @JoinColumn()
    user: User;

    @ManyToOne(type => Post, {primary: true})
    post: Post;

}
