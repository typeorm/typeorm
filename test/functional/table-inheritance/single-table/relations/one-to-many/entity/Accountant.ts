import { ChildEntity } from "typeorm/decorator/entity/ChildEntity"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { Employee } from "./Employee"
import { Department } from "./Department"

@ChildEntity()
export class Accountant extends Employee {
    @OneToMany((type) => Department, (department) => department.accountant)
    departments: Department[]
}
