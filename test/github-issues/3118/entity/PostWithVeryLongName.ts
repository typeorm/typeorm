import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {AuthorWithVeryLongName} from "./AuthorWithVeryLongName";
import {ManyToMany, Entity, ManyToOne} from "../../../../src";
import {CategoryWithVeryLongName} from "./CategoryWithVeryLongName";

@Entity()
export class PostWithVeryLongName {
    @PrimaryGeneratedColumn()
    postId: number;

    @ManyToOne(() => AuthorWithVeryLongName, author => author.postsWithVeryLongName)
    authorWithVeryLongName: AuthorWithVeryLongName;

    @ManyToMany(() => CategoryWithVeryLongName, category => category.postsWithVeryLongName)
    categories: CategoryWithVeryLongName[];
}
