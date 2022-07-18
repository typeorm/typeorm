import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Category } from "./Category"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { Counters } from "./Counters"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string

    @Column((type) => Counters)
    counters: Counters

    @ManyToMany((type) => Category, (category) => category.posts, {
        cascade: ["update"],
    })
    @JoinTable()
    categories: Category[]
}
