import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Contributor } from "./Contributor"

@ChildEntity()
export class User extends Contributor {
    @Column()
    email: string
}
