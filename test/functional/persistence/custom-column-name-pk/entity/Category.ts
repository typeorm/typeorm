import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Post } from "./Post"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { Generated } from "typeorm/decorator/Generated"

@Entity()
export class Category {
    @PrimaryColumn({ name: "theId" })
    @Generated()
    id: number

    @Column()
    name: string

    @OneToMany((type) => Post, (post) => post.category, {
        cascade: ["insert"],
    })
    posts: Post[]
}
