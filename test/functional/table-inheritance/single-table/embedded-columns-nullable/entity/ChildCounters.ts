import { Column } from "../../../../../../src/decorator/columns/Column"

export class ChildCounters {
    @Column({ nullable: false })
    shares: number

    @Column({ nullable: false })
    views: number
}
