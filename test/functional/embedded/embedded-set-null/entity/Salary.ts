import { Column } from "../../../../../src/decorator/columns/Column"

export class Salary {
    @Column("decimal", { nullable: true })
    amount: number | null
}
