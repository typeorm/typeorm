import { Column } from "typeorm/decorator/columns/Column"
import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Accountant } from "./Accountant"

@Entity()
export class Department {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((type) => Accountant, (accountant) => accountant.departments)
    accountant: Accountant
}
