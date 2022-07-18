import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { Category } from "./Category"
import { PrimaryColumn } from "typeorm"

@Entity()
export class Image {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @OneToOne((type) => Category, (category) => category.image)
    category: Category

    categoryId: number
}
