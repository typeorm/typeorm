import { Category } from "./Category"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { PrimaryColumn } from "typeorm"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @ManyToMany((type) => Category, (category) => category.posts, {
        cascade: ["insert"],
    })
    @JoinTable()
    categories: Category[]
}
