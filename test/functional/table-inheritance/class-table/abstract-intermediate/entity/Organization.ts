import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Actor } from "./Actor"

/**
 * Organization extends Actor directly (skipping Contributor).
 * It should NOT get the `reputation` column.
 */
@ChildEntity()
export class Organization extends Actor {
    @Column()
    industry: string
}
