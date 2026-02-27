import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Actor } from "./Actor"

@ChildEntity()
export class User extends Actor {
    @Column()
    email: string

    @Column({ default: "pending" })
    status: string
}
