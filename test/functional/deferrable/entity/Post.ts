import { Column } from "../../../../src/decorator/columns/Column"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { ManyToMany } from "../../../../src/decorator/relations/ManyToMany"
import { JoinTable } from "../../../../src/decorator/relations/JoinTable"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @ManyToMany(() => Category, (category) => category.posts, {
        deferrable: "INITIALLY DEFERRED",
    })
    @JoinTable()
    categories: Category[]
}
