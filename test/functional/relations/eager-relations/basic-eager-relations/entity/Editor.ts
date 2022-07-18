import { Entity } from "typeorm/decorator/entity/Entity"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { User } from "./User"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Post } from "./Post"
import { PrimaryColumn } from "typeorm"

@Entity()
export class Editor {
    @PrimaryColumn()
    userId: number

    @PrimaryColumn()
    postId: number

    @OneToOne((type) => User, { eager: true })
    @JoinColumn()
    user: User

    @ManyToOne((type) => Post)
    post: Post
}
