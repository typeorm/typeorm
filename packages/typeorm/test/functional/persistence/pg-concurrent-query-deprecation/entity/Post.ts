import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { DeleteDateColumn } from "../../../../../src/decorator/columns/DeleteDateColumn"
import { ManyToMany } from "../../../../../src/decorator/relations/ManyToMany"
import { JoinTable } from "../../../../../src/decorator/relations/JoinTable"
import { Tag } from "./Tag"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @DeleteDateColumn()
    deletedAt?: Date

    @ManyToMany(() => Tag, (tag) => tag.posts, { cascade: true })
    @JoinTable()
    tags: Tag[]
}
