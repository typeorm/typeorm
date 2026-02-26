import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { Actor } from "./Actor"

@ChildEntity({ discriminatorValue: "organization" })
export class Organization extends Actor {
    @Column()
    industry: string
}
