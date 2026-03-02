import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Resource } from "./Resource"

@ChildEntity()
export class Document extends Resource {
    @Column()
    content: string
}
