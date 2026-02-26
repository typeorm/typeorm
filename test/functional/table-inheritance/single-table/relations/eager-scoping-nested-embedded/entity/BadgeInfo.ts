import { Column } from "../../../../../../../src/decorator/columns/Column"
import { OneToOne } from "../../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../../src/decorator/relations/JoinColumn"
import { Badge } from "./Badge"

/**
 * Nested embedded class: lives inside EmployeeProfile.
 * Contains an eager relation to Badge.
 */
export class BadgeInfo {
    @Column({ nullable: true })
    issuer: string

    @OneToOne(() => Badge, { eager: true, nullable: true })
    @JoinColumn()
    badge: Badge
}
