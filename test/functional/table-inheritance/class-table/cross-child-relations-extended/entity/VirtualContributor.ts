import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { Actor } from "./Actor"
import { Account } from "./Account"

@ChildEntity()
export class VirtualContributor extends Actor {
    @Column()
    aiModel: string

    @ManyToOne(() => Account, (a) => a.virtualContributors, {
        eager: false,
        onDelete: "SET NULL",
    })
    account: Account
}
