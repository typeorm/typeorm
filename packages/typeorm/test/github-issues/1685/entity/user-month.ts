import {
    PrimaryColumn,
    Entity,
    ManyToOne,
    BeforeInsert,
    JoinColumn,
} from "../../../../src"
import { Month } from "./month"
import { User } from "./user"

@Entity()
export class UserMonth {
    @PrimaryColumn()
    public yearNo: number

    @PrimaryColumn()
    public monthNo: number

    @PrimaryColumn()
    public username: string

    @ManyToOne(() => Month, (month) => month.userMonth)
    @JoinColumn([
        { name: "yearNo", referencedColumnName: "yearNo" },
        { name: "monthNo", referencedColumnName: "monthNo" },
    ])
    public month: Month

    @ManyToOne(() => User, (user) => user.username)
    @JoinColumn({ name: "username", referencedColumnName: "username" })
    public user: User

    @BeforeInsert()
    workaround() {
        // Here a workaround for this issue
        // this.yearNo = this.month.year.yearNo;
    }
}
