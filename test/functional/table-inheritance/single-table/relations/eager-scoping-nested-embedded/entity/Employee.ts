import { Column } from "../../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../../src/decorator/entity/ChildEntity"
import { Person } from "./Person"
import { EmployeeProfile } from "./EmployeeProfile"

@ChildEntity()
export class Employee extends Person {
    @Column()
    salary: number

    @Column(() => EmployeeProfile)
    profile: EmployeeProfile
}
