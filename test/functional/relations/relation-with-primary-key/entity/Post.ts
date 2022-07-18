import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Category } from "./Category"
import { PrimaryColumn } from "typeorm"

@Entity()
export class Post {
    @PrimaryColumn()
    categoryId: number

    @ManyToOne((type) => Category, (category) => category.posts, {
        cascade: ["insert"],
    })
    category: Category

    @Column()
    title: string
}
