import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Actor } from "./Actor"

@ChildEntity()
export class Organization extends Actor {
    @Column()
    industry: string

    @Column({ default: "inactive" })
    status: string
}
