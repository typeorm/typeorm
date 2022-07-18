import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Author } from "./Author"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany((type) => Author)
    @JoinTable()
    authors: Author[]
}
