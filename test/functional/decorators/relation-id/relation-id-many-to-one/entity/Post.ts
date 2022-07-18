import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { RelationId } from "typeorm/decorator/relations/RelationId"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @ManyToOne((type) => Category)
    @JoinColumn()
    category: Category

    @ManyToOne((type) => Category)
    @JoinColumn({ referencedColumnName: "name" })
    categoryByName: Category

    @RelationId((post: Post) => post.category)
    categoryId: number

    @RelationId((post: Post) => post.categoryByName)
    categoryName: string
}
