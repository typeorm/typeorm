import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { ManyToMany } from "../../../../../src/decorator/relations/ManyToMany"
import { Post } from "./Post"

@Entity()
export class CategoryWithCompositePK {
    @PrimaryColumn()
    categoryId: number

    @PrimaryColumn()
    categoryType: string

    @Column()
    name: string

    @ManyToMany(() => Post, (post) => post.compositePKCategories)
    posts: Post[]
}
