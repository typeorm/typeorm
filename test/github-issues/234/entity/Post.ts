import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Category } from "./Category"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { Tag } from "./Tag"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => Category, (category) => category.posts, {
        cascade: ["insert"],
    })
    category: Promise<Category>

    @ManyToMany((type) => Tag, (tag) => tag.posts, {
        cascade: ["insert"],
    })
    @JoinTable()
    tags: Promise<Tag[]>
}
