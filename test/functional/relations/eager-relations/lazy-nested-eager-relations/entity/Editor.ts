import { Entity } from "../typeorm/decorator/entity/Entity"
import { ManyToOne } from "../typeorm/decorator/relations/ManyToOne"
import { User } from "./User"
import { Post } from "./Post"
import {
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../typeorm"

@Entity()
export class Editor {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne((type) => User, { eager: true })
    @JoinColumn()
    user: User

    @ManyToOne((type) => Post, { lazy: true })
    post: Promise<Post>
}
