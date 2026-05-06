import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { PostAuthor } from "./PostAuthor"

@Entity()
export class NestedPost {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column(() => PostAuthor)
    postAuthor: PostAuthor
}
