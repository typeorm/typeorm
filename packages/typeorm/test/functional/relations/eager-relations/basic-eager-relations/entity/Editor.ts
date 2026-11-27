import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { User } from "./User"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { Post } from "./Post"
import { PrimaryColumn } from "../../../../../../src"

@Entity()
export class Editor {
    @PrimaryColumn()
    userId: number

    @PrimaryColumn()
    postId: number

    @OneToOne(() => User, { eager: true })
    @JoinColumn()
    user: User

    @ManyToOne(() => Post)
    post: Post
}
