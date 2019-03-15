import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { Column, Entity, OneToMany } from "../../../../src";
import { PostWithVeryLongName } from "./PostWithVeryLongName";

@Entity()
export class AuthorWithVeryLongName {
    @PrimaryGeneratedColumn()
    authorId: number;

    @Column()
    firstName: string;

    @OneToMany(() => PostWithVeryLongName, post => post.authorWithVeryLongName)
    postsWithVeryLongName: PostWithVeryLongName[];
}
