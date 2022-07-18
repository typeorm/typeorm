import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({ type: "text" })
    text: string

    @Column({ type: "int" })
    likesCount: number

    @Column({ type: "int" })
    commentsCount: number

    @Column({ type: "int" })
    watchesCount: number
}
