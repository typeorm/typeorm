import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { Category } from "./Category"

@Entity()
export class CategoryMetadata {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    keyword: string

    @OneToOne((type) => Category, (category) => category.metadata)
    category: Category
}
