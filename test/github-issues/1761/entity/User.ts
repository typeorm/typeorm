import {Entity, PrimaryGeneratedColumn, OneToMany} from "../../../../src";
import {Comment} from "./Comment";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(type => Comment, comment => comment.user)
    comments: Comment[];

}
