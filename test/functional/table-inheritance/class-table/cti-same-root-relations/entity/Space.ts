import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { Actor } from "./Actor"
import { Account } from "./Account"

@ChildEntity()
export class Space extends Actor {
    @Column()
    visibility: string

    @ManyToOne(() => Account, (account) => account.spaces, { nullable: true })
    account: Account
}
