import { Column, Entity, PrimaryGeneratedColumn } from "typeorm/index"
import { Category } from "./Category"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"

@Entity()
export class Animal {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Category)
    category: Category
}
