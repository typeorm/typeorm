import { Column } from "../../../../src/decorator/columns/Column"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { ManyToMany } from "../../../../src/decorator/relations/ManyToMany"
import { Post } from "./Post"

@Entity()
export class Category {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @ManyToMany(() => Post, (post) => post.categories, {
        deferrable: "INITIALLY DEFERRED",
    })
    posts: Post[]
}
