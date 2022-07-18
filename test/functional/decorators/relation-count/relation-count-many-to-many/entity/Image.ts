import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { RelationCount } from "typeorm/decorator/relations/RelationCount"
import { Category } from "./Category"

@Entity()
export class Image {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    isRemoved: boolean = false

    @ManyToMany((type) => Category, (category) => category.images)
    categories: Category[]

    @RelationCount((image: Image) => image.categories)
    categoryCount: number
}
