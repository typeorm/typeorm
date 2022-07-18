import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryColumn()
    firstId: number

    @PrimaryColumn()
    secondId: number

    @Column()
    title: string

    @ManyToOne((type) => Category, (category) => category.posts)
    category: Category
}
