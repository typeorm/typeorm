import { Entity } from "../../typeorm/decorator/entity/Entity"
import { Column } from "../../typeorm/decorator/columns/Column"
import { PrimaryColumn } from "../../typeorm/decorator/columns/PrimaryColumn"
import { Category } from "./Category"
import { OneToMany } from "../../typeorm/decorator/relations/OneToMany"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    authorId: number

    @Column()
    title: string

    @OneToMany((type) => Category, (category) => category.post)
    categories: Category[]

    categoryIds: any[]
}
