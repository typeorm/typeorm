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

    @ManyToOne(() => Category)
    category: Category

    @Column("simple-json", { nullable: true })
    meta?: PostMeta

    @ManyToMany(() => Tag, (tag) => tag.posts, {
        cascade: ["insert", "update", "soft-remove", "recover"],
    })
    @JoinTable()
    tags: Tag[]
}
