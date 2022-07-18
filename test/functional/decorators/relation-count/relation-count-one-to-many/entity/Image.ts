import { PrimaryColumn } from "../typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "../typeorm/decorator/entity/Entity"
import { Column } from "../typeorm/decorator/columns/Column"
import { ManyToOne } from "../typeorm/decorator/relations/ManyToOne"
import { Category } from "./Category"

@Entity()
export class Image {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    isRemoved: boolean = false

    @ManyToOne((type) => Category, (category) => category.images)
    category: Category
}
