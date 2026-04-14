import { Column } from "../../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../../src/decorator/entity/ChildEntity"
import { OneToOne } from "../../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../../src/decorator/relations/JoinColumn"
import { Person } from "./Person"
import { EmployeeBadge } from "./EmployeeBadge"

@ChildEntity()
export class Employee extends Person {
    @Column()
    salary: number

    @OneToOne(() => EmployeeBadge, { eager: true, nullable: true })
    @JoinColumn()
    badge: EmployeeBadge
}
