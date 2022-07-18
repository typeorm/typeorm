import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { Category } from "./Category"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @OneToMany((type) => Category, (category) => category.post)
    categories: Category[]

    constructor(id: number, title: string) {
        this.id = id
        this.title = title
    }
}
