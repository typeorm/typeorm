import {Column, Entity, Generated, OneToMany, PrimaryColumn } from "../../../../src"
import { Post } from "./Post";
import {ID_TRANSFORMER} from "../transformer";

@Entity()
export class User {
    @Generated("increment")
    @PrimaryColumn({
        type: "integer",
        transformer: ID_TRANSFORMER,
    })
    id: string

    @Column()
    name: string;

    @OneToMany(() => Post, (post) => post.user, { cascade: ['insert', 'update'] })
    posts: Post[];
}
