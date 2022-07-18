import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../typeorm/decorator/columns/Column"
import { Category } from "./Category"
import { ManyToOne } from "../typeorm/decorator/relations/ManyToOne"

@Entity()
export class Image {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    isRemoved: boolean = false

    @ManyToOne((type) => Category, (category) => category.images)
    category: Category[]
}
