import { Column } from "typeorm/decorator/columns/Column"
import { Category } from "./Category"
import { Subcounters } from "./Subcounters"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"

export class Counters {
    @Column()
    likes: number

    @Column()
    comments: number

    @Column()
    favorites: number

    @OneToMany((type) => Category, (category) => category.posts)
    categories: Category[]

    @Column(() => Subcounters, { prefix: "sub" })
    subcounters: Subcounters

    categoryIds: number[]
}
