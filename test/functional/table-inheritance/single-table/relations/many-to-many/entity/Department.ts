import { Column } from "../../typeorm/decorator/columns/Column"
import { Entity } from "../../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { ManyToMany } from "../../typeorm/decorator/relations/ManyToMany"
import { Accountant } from "./Accountant"

@Entity()
export class Department {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany((type) => Accountant, (accountant) => accountant.departments)
    accountants: Accountant[]
}
