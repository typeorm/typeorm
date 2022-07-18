import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Category } from "./Category"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { User } from "./User"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne((type) => User)
    author: User

    @ManyToMany((type) => Category)
    @JoinTable()
    categories: Category[]
}
