import {
    BaseEntity,
    Column,
    Entity,
    IsNull,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../src"
import { Category } from "./Category"
import {Staff} from "./Staff";
import {Customer} from "./Customer";

@Entity()
export class Post extends BaseEntity {

    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @Column({
        default: "This is default text.",
    })
    text: string

    @Column({ type: "date", nullable: true })
    blockedAt: Date | null

    @Column({ type: "date", nullable: true })
    deletedAt: Date | null

    @ManyToMany((type) => Category, { where: { deletedAt: IsNull() } })
    @JoinTable()
    categories: Category[]

    @ManyToOne((type) => Staff,(item) => item.blockedPosts, { nullable: true })
    blockedBy: Staff | null

    @ManyToOne((type) => Customer, (item) => item.posts, {})
    createdBy: Customer
}
