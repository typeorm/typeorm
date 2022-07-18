import { PrimaryColumn } from "../typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "../typeorm/decorator/entity/Entity"
import { Column } from "../typeorm/decorator/columns/Column"
import { OneToOne } from "../typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "../typeorm/decorator/relations/JoinColumn"
import { Category } from "./Category"
import { RelationId } from "../typeorm/decorator/relations/RelationId"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @OneToOne((type) => Category)
    @JoinColumn()
    category: Category

    @OneToOne((type) => Category)
    @JoinColumn({ referencedColumnName: "name" })
    categoryByName: Category

    @OneToOne((type) => Category, (category) => category.post)
    @JoinColumn()
    category2: Category

    @RelationId((post: Post) => post.category)
    categoryId: number

    @RelationId((post: Post) => post.categoryByName)
    categoryName: string

    @RelationId((post: Post) => post.category2)
    category2Id: number
}
