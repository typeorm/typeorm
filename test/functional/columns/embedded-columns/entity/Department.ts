import { JoinColumn, OneToOne } from "../../../../../src"
import { Account } from "./Account"

export class Department {
    @OneToOne(() => Account, { eager: true, cascade: true })
    @JoinColumn()
    account: Account
}
