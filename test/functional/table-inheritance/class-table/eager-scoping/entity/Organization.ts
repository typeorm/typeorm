import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { Actor } from "./Actor"
import { OrgVerification } from "./OrgVerification"

@ChildEntity()
export class Organization extends Actor {
    @Column()
    industry: string

    @OneToOne(() => OrgVerification, { eager: true })
    @JoinColumn()
    verification: OrgVerification
}
