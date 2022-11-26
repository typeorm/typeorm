import { Entity, PrimaryColumn, ManyToOne, Column } from "../../../../src"
import { PostId } from "../model/PostId"
import { UserId } from "../model/UserId"
import { User } from "./User"

@Entity()
export class Post {
    @PrimaryColumn({
        type: "text",
        transformer: {
            from(value: string) {
                return new PostId(value)
            },
            to(id: PostId) {
                return id.value
            },
        },
    })
    id!: PostId

    @ManyToOne(() => User)
    author?: User

    @Column({
        type: "text",
        transformer: {
            from(value: string) {
                return new UserId(value)
            },
            to(id: UserId) {
                return id.value
            },
        },
    })
    authorId!: UserId
}
