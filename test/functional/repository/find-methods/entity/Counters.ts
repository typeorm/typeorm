import { Column } from "../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { Category } from "./Category"

export class Counters {
    @Column({ default: 0 })
    likes: number

    @ManyToOne(() => Category, { nullable: true })
    category?: Category
}
