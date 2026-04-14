import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Actor } from "./Actor"

@ChildEntity()
export class Organization extends Actor {
    @Column()
    industry: string

    // Organization does NOT override "color" — inherits from Actor table
}
