import { Category } from "./Category"
import { Entity } from "typeorm/decorator/entity/Entity"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @OneToMany((type) => Category, (category) => category.post)
    categories: Category[] | null

    @Column()
    title: string
}
