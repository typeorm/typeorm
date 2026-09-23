import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryColumn } from "../../../../../src/decorator/columns/PrimaryColumn"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { Counters } from "./Counters"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @Column()
    categoryName: string

    @Column()
    isNew: boolean = false

    @Column(() => Counters)
    counters: Counters

    @ManyToOne(() => Category, { nullable: true })
    category?: Category
}
