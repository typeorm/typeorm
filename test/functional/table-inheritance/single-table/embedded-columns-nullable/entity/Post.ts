import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { Content } from "./Content"
import { ChildCounters } from "./ChildCounters"

@ChildEntity()
export class Post extends Content {
    @Column()
    viewCount: number

    @Column(() => ChildCounters, { prefix: false })
    childCounters: ChildCounters
}
