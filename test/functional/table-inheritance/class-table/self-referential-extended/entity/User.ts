import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { Generated } from "../../../../../../src/decorator/Generated"
import { Actor } from "./Actor"

@ChildEntity()
export class User extends Actor {
    @Column()
    email: string

    @Column("uuid")
    accountID: string

    @Column({ unique: true })
    @Generated("increment")
    rowId: number
}
