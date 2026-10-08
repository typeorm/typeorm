import { Column, Entity, OneToMany, PrimaryColumn } from "../../../../../../src"
import { LazyPost } from "./LazyPost"

@Entity("lazy_user")
export class LazyUser {
    @PrimaryColumn()
    id: string

    @Column()
    name: string

    @OneToMany(() => LazyPost, (post) => post.user)
    posts: Promise<LazyPost[]>
}
