import {
    Column,
    Entity,
    Generated,
    OneToMany,
    PrimaryColumn,
} from "../../../../src"
import { idTransformer } from "../transformer"
import { Post } from "./Post"

@Entity()
export class User {
    @Generated("increment")
    @PrimaryColumn({ type: "integer", transformer: idTransformer })
    id: string

    @Column()
    name: string

    @OneToMany(() => Post, (post) => post.user, { cascade: ["insert"] })
    posts: Post[]
}
