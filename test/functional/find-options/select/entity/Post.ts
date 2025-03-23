import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../src"
import { Tag } from "./Tag"
import { Category } from "./Category"
import { PostMeta } from "../types"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string

    @ManyToOne((type) => Category)
    category: Category

    @Column("json", { nullable: true })
    meta?: PostMeta

    @ManyToMany(() => Tag, (tag) => tag.posts, {
        cascade: ["insert", "update", "soft-remove", "recover"],
    })
    @JoinTable()
    tags: Tag[]
}
