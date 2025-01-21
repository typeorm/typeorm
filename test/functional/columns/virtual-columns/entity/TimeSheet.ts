import {
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    VirtualColumn,
} from "../../../../../src"
import { Activity } from "./Activity"
import { Employee } from "./Employee"

@Entity({ name: "timesheets" })
export class TimeSheet {
    @PrimaryGeneratedColumn()
    id: number

    @VirtualColumn({
        query: (alias) =>
            `SELECT SUM("hours") FROM "activities" WHERE "timesheetId" = ${alias}."id"`,
    })
    totalActivityHours: number

    @ManyToOne(() => Activity, (activity) => activity.timesheet)
    activities: Activity[]

    @ManyToOne(() => Employee, (employee) => employee.timesheets)
    employee: Employee
}
