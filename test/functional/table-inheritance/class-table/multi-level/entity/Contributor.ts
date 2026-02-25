import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Actor } from "./Actor"

@ChildEntity()
export class Contributor extends Actor {
    @Column()
    reputation: number
}
