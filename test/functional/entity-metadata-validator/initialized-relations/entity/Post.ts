import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Category } from "./Category"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @OneToOne((type) => Category)
    @JoinColumn()
    category: Category

    @ManyToMany((type) => Category)
    @JoinTable()
    categories: Category[] = []
}
