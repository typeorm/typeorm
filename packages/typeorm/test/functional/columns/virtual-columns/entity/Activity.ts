import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { TimeSheet } from "./TimeSheet"

@Entity({ name: "activities" })
export class Activity {
    @PrimaryGeneratedColumn()
    id: number

    @Column("int")
    hours: number

    @ManyToOne(() => TimeSheet, (timesheet) => timesheet.activities)
    timesheet: TimeSheet
}
