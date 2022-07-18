import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { Comment } from "./Comment"

@Entity()
export class Guest {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    username: string

    @OneToMany((type) => Comment, (comment) => comment.author)
    comments: Comment[]
}
