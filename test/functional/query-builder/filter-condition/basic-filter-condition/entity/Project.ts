import {
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Post } from "./Post"

@Entity()
export class Project {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToMany(() => Post)
    @JoinTable()
    posts: Post[]
}
