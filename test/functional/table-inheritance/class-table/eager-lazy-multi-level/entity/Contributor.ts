import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { Actor } from "./Actor"
import { Badge } from "./Badge"

@ChildEntity()
export class Contributor extends Actor {
    @Column()
    reputation: number

    @OneToOne(() => Badge, { eager: true })
    @JoinColumn()
    badge: Badge
}
