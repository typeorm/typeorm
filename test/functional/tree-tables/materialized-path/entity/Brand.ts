import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Product } from "./Product"

@Entity()
export class Brand {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Product, (product) => product.brand)
    products: Product[]
}
