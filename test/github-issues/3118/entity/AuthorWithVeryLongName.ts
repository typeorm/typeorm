import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { GroupWithVeryLongName } from "./GroupWithVeryLongName";
import { PostWithVeryLongName } from "./PostWithVeryLongName";

@Entity()
export class AuthorWithVeryLongName {
    @PrimaryGeneratedColumn()
    authorId: number;

    @Column()
    firstName: string;

    @ManyToOne(() => GroupWithVeryLongName, group => group.authorsWithVeryLongName)
    groupWithVeryLongName: GroupWithVeryLongName;

    @OneToMany(() => PostWithVeryLongName, post => post.authorWithVeryLongName)
    postsWithVeryLongName: PostWithVeryLongName[];
}
