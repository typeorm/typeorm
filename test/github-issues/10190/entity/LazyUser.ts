import { Entity, Column, OneToMany, PrimaryColumn } from "../../../../src"
import { LazyPost } from "./LazyPost"

@Entity("lazy_user")
export class LazyUser {
    @PrimaryColumn({ type: "varchar" })
    id: string

    @Column()
    name: string

    @OneToMany(() => LazyPost, (p) => p.user)
    posts: Promise<LazyPost[]>
}
