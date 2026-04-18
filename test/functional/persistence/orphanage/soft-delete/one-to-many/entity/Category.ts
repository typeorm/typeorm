import { Entity } from "../../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { OneToMany } from "../../../../../../../src/decorator/relations/OneToMany"
import { DeleteDateColumn } from "../../../../../../../src"
import { Post } from "./Post"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @OneToMany(() => Post, (post) => post.category, {
        cascade: ["insert"],
        orphans: "soft-delete",
    })
    posts: Post[]

    @DeleteDateColumn()
    deletedAt?: Date
}
