import { JoinTable, Entity, ManyToMany } from "typeorm"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { PostWithVeryLongName } from "./PostWithVeryLongName"

@Entity()
export class CategoryWithVeryLongName {
    @PrimaryGeneratedColumn()
    categoryId: number

    @Column({ default: "dummy name" })
    name: string

    @ManyToMany(() => PostWithVeryLongName, (post) => post.categories)
    @JoinTable()
    postsWithVeryLongName: PostWithVeryLongName[]
}
