import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToMany,
    JoinTable,
} from "../../../../../src"
import { Tag } from "./Tag"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    title: string

    @ManyToMany(() => Tag)
    @JoinTable({
        joinColumns: [{ name: "postId", referencedColumnName: "id" }],
        inverseJoinColumns: [
            { name: "tagSecondId", referencedColumnName: "secondId" },
            { name: "tagFirstId", referencedColumnName: "firstId" },
        ],
    })
    tags: Tag[]
}
