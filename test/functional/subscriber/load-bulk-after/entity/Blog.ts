import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { OneToMany, Column } from "../../../../../src";

import { Post } from "./Post";

@Entity()
export class Blog {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.blog, {
        cascade: true,
        eager: true,
    })
    posts: Post[];

    postCount: number;
}
