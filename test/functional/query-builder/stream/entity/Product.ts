import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from "../../../../../src"
import { Category } from "./Category"

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Category)
    category: Category
}
