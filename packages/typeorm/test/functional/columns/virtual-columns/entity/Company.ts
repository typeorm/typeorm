import { default as sql } from "dedent"
import {
    Entity,
    OneToMany,
    PrimaryColumn,
    VirtualColumn,
} from "../../../../../src"
import { Employee } from "./Employee"

@Entity({ name: "companies" })
export class Company {
    @PrimaryColumn()
    name: string

    @OneToMany(() => Employee, (employee) => employee.company, {
        cascade: true,
    })
    employees: Employee[]

    @VirtualColumn({
        query: (alias) =>
            sql`SELECT COUNT("name") FROM "employees" WHERE "companyName" = ${alias}."name"`,
    })
    totalEmployeesCount?: number

    @VirtualColumn({
        select: false,
        query: (alias) => sql`
            SELECT SUM("activities"."hours")
            FROM "activities"
            INNER JOIN "timesheets" ON "activities"."timesheetId" = "timesheets"."id"
            INNER JOIN "employees" ON "timesheets"."employeeName" = "employees"."name"
            WHERE "employees"."companyName" = ${alias}."name"`,
    })
    totalReportedHours?: number
}
