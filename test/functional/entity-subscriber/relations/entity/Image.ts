import { Entity, OneToOne, PrimaryGeneratedColumn } from "../../../../../src"
import { Category } from "./Category"

@Entity()
export class Image {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne(() => Category, (category) => category.image)
    defaultImageOf: Category
}
