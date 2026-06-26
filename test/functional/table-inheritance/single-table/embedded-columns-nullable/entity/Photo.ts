import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { Content } from "./Content"

@ChildEntity()
export class Photo extends Content {
    @Column()
    size: string
}
