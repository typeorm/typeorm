import {JoinTable, Entity, ManyToMany} from "../../../../src";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {PostWithVeryLongName} from "./PostWithVeryLongName";

@Entity()
export class CategoryWithVeryLongName {
    @PrimaryGeneratedColumn()
    categoryId: number;

    @ManyToMany(() => PostWithVeryLongName, post => post.categories)
    @JoinTable()
    postsWithVeryLongName: PostWithVeryLongName[];
}
