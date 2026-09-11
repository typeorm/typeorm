import { PrimaryColumn, Entity, OneToMany } from "../../../../src"
import { UserMonth } from "./user-month"

@Entity()
export class User {
    @PrimaryColumn()
    public username: string

    @OneToMany(() => UserMonth, (userMonth) => userMonth.user)
    public userMonths: UserMonth[]
}
