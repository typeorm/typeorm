import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { Actor } from "./Actor"
import { Organization } from "./Organization"

@ChildEntity()
export class User extends Actor {
    @Column()
    email: string

    @ManyToOne(() => Organization, (org) => org.members, { nullable: true })
    employer: Organization
}
