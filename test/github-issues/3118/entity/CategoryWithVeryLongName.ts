import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { PostWithVeryLongName } from "./PostWithVeryLongName";

@Entity()
export class CategoryWithVeryLongName {
    @PrimaryGeneratedColumn()
    categoryId: number;

    @Column({default: "dummy name"})
    name: string;

    @ManyToMany(() => PostWithVeryLongName, post => post.categories)
    @JoinTable()
    postsWithVeryLongName: PostWithVeryLongName[];
}
