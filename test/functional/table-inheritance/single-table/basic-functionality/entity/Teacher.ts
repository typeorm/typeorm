import { Column } from "typeorm/decorator/columns/Column"
import { ChildEntity } from "typeorm/decorator/entity/ChildEntity"
import { Employee } from "./Employee"

@ChildEntity()
export class Teacher extends Employee {
    @Column()
    specialization: string
}
