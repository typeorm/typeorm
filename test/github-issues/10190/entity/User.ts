import { Entity, Column, OneToMany, PrimaryColumn } from "../../../../src"
import { Post } from "./Post"

@Entity("user")
export class User {
    @PrimaryColumn({ type: "varchar" })
    id: string

    @Column()
    name: string

    @OneToMany(() => Post, (p) => p.user)
    posts: Post[]
}
