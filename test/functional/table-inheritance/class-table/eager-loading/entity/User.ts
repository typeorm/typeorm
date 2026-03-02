import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { OneToMany } from "../../../../../../src/decorator/relations/OneToMany"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { Actor } from "./Actor"
import { Profile } from "./Profile"
import { Post } from "./Post"

@ChildEntity()
export class User extends Actor {
    @Column()
    email: string

    @OneToOne(() => Profile, { eager: true })
    @JoinColumn()
    profile: Profile

    @OneToMany(() => Post, (post) => post.author, { eager: true })
    posts: Post[]
}
