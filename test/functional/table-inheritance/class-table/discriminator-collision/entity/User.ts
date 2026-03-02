import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Actor } from "./Actor"

/**
 * User defines a column named "type" — same as the parent's discriminator.
 * Since in CTI each child has its own table, this should not conflict:
 * the discriminator "type" lives on the actor table, and this child's
 * "type" column lives on the user table.
 */
@ChildEntity()
export class User extends Actor {
    @Column()
    email: string

    @Column()
    type: string
}
