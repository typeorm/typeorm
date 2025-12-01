import { Entity, ManyToOne, OneToMany, PrimaryColumn } from "../../../../../src"
import { Company } from "./Company"
import { TimeSheet } from "./TimeSheet"

@Entity({ name: "employees" })
export class Employee {
    @PrimaryColumn()
    name: string

    @ManyToOne(() => Company, (company) => company.employees)
    company: Company

    @OneToMany(() => TimeSheet, (timesheet) => timesheet.employee, {
        cascade: true,
    })
    timesheets: TimeSheet[]
}
