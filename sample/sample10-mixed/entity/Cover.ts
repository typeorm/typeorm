import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "../../../src/index";
import {Post} from "./Post";

@Entity("sample10_cover")
export class Cover {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @OneToMany(type => Post, post => post.cover)
    posts: Post[];

}