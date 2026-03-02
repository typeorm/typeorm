import { Column } from "../../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../../src/decorator/entity/ChildEntity"
import { OneToOne } from "../../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../../src/decorator/relations/JoinColumn"
import { Person } from "./Person"
import { EmployeeVerification } from "./EmployeeVerification"

@ChildEntity()
export class Employee extends Person {
    @Column()
    salary: number

    @OneToOne(() => EmployeeVerification, { eager: true, nullable: true })
    @JoinColumn()
    verification: EmployeeVerification
}
