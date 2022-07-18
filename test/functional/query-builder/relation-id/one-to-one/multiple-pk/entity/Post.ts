import { Entity } from "../../typeorm/decorator/entity/Entity"
import { Column } from "../../typeorm/decorator/columns/Column"
import { PrimaryColumn } from "../../typeorm/decorator/columns/PrimaryColumn"
import { OneToOne } from "../../typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "../../typeorm/decorator/relations/JoinColumn"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    authorId: number

    @Column()
    title: string

    @Column()
    isRemoved: boolean = false

    @OneToOne((type) => Category, (category) => category.post)
    @JoinColumn()
    category: Category

    @OneToOne((type) => Category)
    @JoinColumn()
    subcategory: Category

    categoryId: number
}
