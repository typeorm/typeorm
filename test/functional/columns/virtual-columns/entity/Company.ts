import {
    Entity,
    OneToMany,
    PrimaryColumn,
    VirtualColumn,
} from "../../../../../src"
import { Employee } from "./Employee"

@Entity({ name: "companies" })
export class Company {
    @PrimaryColumn("varchar", { length: 50 })
    name: string

    @VirtualColumn({
        query: (alias) =>
            `SELECT COUNT("name") FROM "employees" WHERE "companyName" = ${alias}."name"`,
    })
    totalEmployeesCount: number

    @OneToMany(() => Employee, (employee) => employee.company)
    employees: Employee[]
}
