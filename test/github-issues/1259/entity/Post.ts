import { Column, Entity, PrimaryGeneratedColumn } from "typeorm/index"
import { Category } from "./Category"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    count: number

    @ManyToMany((type) => Category)
    @JoinTable()
    categories: Category[]
}
