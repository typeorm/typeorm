import { Entity, ManyToOne, OneToMany, PrimaryColumn } from "../../../../../src"
import { Company } from "./Company"
import { TimeSheet } from "./TimeSheet"

@Entity({ name: "employees" })
export class Employee {
    @PrimaryColumn("varchar", { length: 50 })
    name: string

    @ManyToOne(() => Company, (company) => company.employees)
    company: Company

    @OneToMany(() => TimeSheet, (timesheet) => timesheet.employee)
    timesheets: TimeSheet[]
}
