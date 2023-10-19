import {BaseEntity, Column, Entity, OneToMany, PrimaryColumn} from "../../../../../src"
import {Post} from "./Post";

@Entity()
export class Staff extends BaseEntity {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column({ type: "date", nullable: true })
    deletedAt: Date | null

    @OneToMany((type) => Post, (item) => item.blockedBy)
    blockedPosts: Staff[]
}
