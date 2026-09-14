import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Salary } from "./Salary"

@Entity()
export class Employee {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column(() => Salary)
    salary: Salary | null
}
