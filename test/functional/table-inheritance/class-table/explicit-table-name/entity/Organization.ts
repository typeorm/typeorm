import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Actor } from "./Actor"

@ChildEntity({ discriminatorValue: "Org", tableName: "app_organizations" })
export class Organization extends Actor {
    @Column()
    industry: string
}
