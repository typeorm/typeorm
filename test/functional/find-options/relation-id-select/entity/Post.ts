import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { JoinColumn } from "../../../../../src/decorator/relations/JoinColumn"
import { RelationId } from "../../../../../src/decorator/relations/RelationId"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => Category)
    @JoinColumn()
    category: Category

    @RelationId((post: Post) => post.category)
    categoryId: number
}
