import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Category } from "./Category"
import { OneToMany } from "../../../../../src/decorator/relations/OneToMany"
import { Column } from "../../../../../src/decorator/columns/Column"
import { JoinColumn, ManyToOne } from "../../../../../src"
import { Brand } from "./Brand"
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

    @ManyToOne(() => Brand, (brand) => brand.products)
    @JoinColumn()
    brand: Brand
}
