import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { ManyToMany } from "../../../../../../src/decorator/relations/ManyToMany"
import { JoinTable } from "../../../../../../src/decorator/relations/JoinTable"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToMany(() => Category, (category) => category.posts)
    @JoinTable()
    categories: Category[]
}
