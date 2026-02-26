import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { Generated } from "../../../../../../src/decorator/Generated"
import { Actor } from "./Actor"

@ChildEntity()
export class Organization extends Actor {
    @Column()
    industry: string

    @Column("uuid")
    accountID: string

    @Column({ unique: true })
    @Generated("increment")
    rowId: number
}
