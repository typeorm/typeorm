import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { VersionColumn } from "../../../../../src/decorator/columns/VersionColumn"
import { Post } from "./Post"
import { OneToMany } from "../../../../../src"
import { CategoryMeta } from "../types"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    description: string

    @VersionColumn()
    version: string

    @Column("simple-json", { nullable: true })
    meta?: CategoryMeta

    @OneToMany(() => Post, (post) => post.category, {
        cascade: ["insert", "update", "soft-remove", "recover"],
    })
    posts: Post[]
}
