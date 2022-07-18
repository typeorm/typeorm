import { Column } from "../typeorm/decorator/columns/Column"
import { PrimaryColumn } from "../typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "../typeorm/decorator/entity/Entity"
import { ManyToOne } from "../typeorm/decorator/relations/ManyToOne"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @Column()
    isRemoved: boolean = false

    @ManyToOne((type) => Category)
    category: Category

    categoryId: number
}
