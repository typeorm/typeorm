import { ChildEntity, Column } from "../../../../src"
import { Content } from "./Content"

@ChildEntity()
export class Photo extends Content {
    @Column()
    size: number
}
