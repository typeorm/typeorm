import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { OneToMany } from "../../../../../../src/decorator/relations/OneToMany"
import { Actor } from "./Actor"
import { Space } from "./Space"
import { VirtualContributor } from "./VirtualContributor"

@ChildEntity()
export class Account extends Actor {
    @Column()
    plan: string

    @OneToMany(() => Space, (s) => s.account, {
        eager: false,
        cascade: true,
    })
    spaces: Space[]

    @OneToMany(() => VirtualContributor, (vc) => vc.account, {
        eager: false,
        cascade: true,
    })
    virtualContributors: VirtualContributor[]
}
