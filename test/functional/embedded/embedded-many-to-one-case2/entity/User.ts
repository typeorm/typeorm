import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { Post } from "./Post"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((type) => Post)
    @JoinColumn()
    likedPost: Post
}
