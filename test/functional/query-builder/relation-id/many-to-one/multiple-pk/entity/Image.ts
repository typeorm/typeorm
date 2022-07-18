import { Entity } from "../../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../typeorm/decorator/columns/Column"
import { OneToMany } from "../../typeorm/decorator/relations/OneToMany"
import { Category } from "./Category"

@Entity()
export class Image {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany((type) => Category, (category) => category.image)
    categories: Category[]

    categoryIds: number[]
}
