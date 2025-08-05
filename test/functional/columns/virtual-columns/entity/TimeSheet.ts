import { default as sql } from "dedent"
import {
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    VirtualColumn,
} from "../../../../../src"
import { Activity } from "./Activity"
import { Employee } from "./Employee"

@Entity({ name: "timesheets" })
export class TimeSheet {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Employee, (employee) => employee.timesheets)
    employee: Employee

    @OneToMany(() => Activity, (activity) => activity.timesheet, {
        cascade: true,
    })
    activities: Activity[]

    @VirtualColumn({
        query: (alias) =>
            sql`SELECT SUM("hours") FROM "activities" WHERE "timesheetId" = ${alias}."id"`,
    })
    totalActivityHours?: number
}
