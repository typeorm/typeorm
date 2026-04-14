import { Column } from "../../../../../../../src/decorator/columns/Column"
import { OneToOne } from "../../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../../src/decorator/relations/JoinColumn"
import { EmployeeBadge } from "./EmployeeBadge"

/**
 * Embedded class used only by Employee.
 * Contains an eager relation to EmployeeBadge.
 */
export class EmployeeProfile {
    @Column({ nullable: true })
    department: string

    @OneToOne(() => EmployeeBadge, { eager: true, nullable: true })
    @JoinColumn()
    badge: EmployeeBadge
}
