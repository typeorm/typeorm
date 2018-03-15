import {Entity, PrimaryGeneratedColumn, OneToMany} from "../../../../src";
import {Comment} from "./Comment";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(type => Comment, comment => comment.post, {cascade: ["insert", "update", "remove"], eager: true})
    comments: Comment[];

}