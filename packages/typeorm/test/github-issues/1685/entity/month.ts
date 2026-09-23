import {
    PrimaryColumn,
    Entity,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from "../../../../src"
import { Year } from "./year"
import { UserMonth } from "./user-month"

@Entity()
export class Month {
    @PrimaryColumn()
    public yearNo: number

    @PrimaryColumn()
    public monthNo: number

    @ManyToOne(() => Year, (year) => year.month)
    @JoinColumn({ name: "yearNo", referencedColumnName: "yearNo" })
    public year: Year

    @OneToMany(() => UserMonth, (userMonth) => userMonth.month)
    public userMonth: UserMonth[]
}
