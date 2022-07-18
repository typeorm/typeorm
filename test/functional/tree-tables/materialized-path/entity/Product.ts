import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Category } from "./Category"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Category, (category) => category.product, {
        cascade: true,
    })
    categories: Category[]
}
