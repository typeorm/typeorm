import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Post } from "./Post"

@Entity({ schema: "guest" })
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((type) => Post)
    post: Post
}
