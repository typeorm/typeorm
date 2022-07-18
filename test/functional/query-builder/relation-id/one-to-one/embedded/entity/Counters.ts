import { Column } from "../../typeorm/decorator/columns/Column"
import { Category } from "./Category"
import { Subcounters } from "./Subcounters"
import { OneToOne } from "../../typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "../../typeorm/decorator/relations/JoinColumn"

export class Counters {
    @Column()
    likes: number

    @Column()
    comments: number

    @Column()
    favorites: number

    @OneToOne((type) => Category, (category) => category.post)
    @JoinColumn()
    category: Category

    @Column(() => Subcounters, { prefix: "sub" })
    subcounters: Subcounters

    categoryId: number
}
