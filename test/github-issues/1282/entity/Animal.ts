import { Column, Entity, PrimaryGeneratedColumn } from "typeorm/index"
import { Category } from "./Category"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"

@Entity()
export class Animal {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany((type) => Category, { eager: true })
    @JoinTable()
    categories: Category[]
}
