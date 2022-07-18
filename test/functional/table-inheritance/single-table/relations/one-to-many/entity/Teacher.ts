import { ChildEntity } from "typeorm/decorator/entity/ChildEntity"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { Employee } from "./Employee"
import { Specialization } from "./Specialization"

@ChildEntity()
export class Teacher extends Employee {
    @OneToMany(
        (type) => Specialization,
        (specialization) => specialization.teacher,
    )
    specializations: Specialization[]
}
