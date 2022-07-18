import { ChildEntity } from "../../typeorm/decorator/entity/ChildEntity"
import { ManyToMany } from "../../typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "../../typeorm/decorator/relations/JoinTable"
import { Employee } from "./Employee"
import { Department } from "./Department"

@ChildEntity()
export class Accountant extends Employee {
    @ManyToMany((type) => Department, (department) => department.accountants)
    @JoinTable()
    departments: Department[]
}
