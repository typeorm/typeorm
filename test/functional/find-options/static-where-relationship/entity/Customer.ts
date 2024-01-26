import {
    BaseEntity,
    Column,
    Entity,
    IsNull,
    OneToMany,
    PrimaryColumn,
} from "../../../../../src"
import { Post } from "./Post"

@Entity()
export class Customer extends BaseEntity {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column({ type: "date", nullable: true })
    deletedAt: Date | null

    @OneToMany((type) => Post, (item) => item.createdBy, {
        where: { blockedBy: IsNull(), deletedAt: IsNull() },
    })
    posts: Post[]
}
