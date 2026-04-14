import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Actor } from "./Actor"

@ChildEntity({ tableName: "app_users" })
export class User extends Actor {
    @Column()
    email: string
}
