import { Column } from "../../../../../../../src/decorator/columns/Column"
import { BadgeInfo } from "./BadgeInfo"

/**
 * Embedded class used only by Employee.
 * Contains a nested embedded (BadgeInfo) which has an eager relation.
 */
export class EmployeeProfile {
    @Column({ nullable: true })
    department: string

    @Column(() => BadgeInfo)
    badgeInfo: BadgeInfo
}
