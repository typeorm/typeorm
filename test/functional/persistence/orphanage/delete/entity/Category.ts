import { Column } from "../../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { OneToMany } from "../../../../../../src/decorator/relations/OneToMany"
import { Post } from "./Post"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Post, (post) => post.category, {
        cascade: ["insert"],
        eager: true,
    })
    posts: Post[]

    constructor(name: string) {
        this.name = name
    }
}
