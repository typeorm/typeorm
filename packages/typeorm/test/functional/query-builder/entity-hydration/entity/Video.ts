import { ChildEntity, Column } from "../../../../../src"
import { Content } from "./Content"

@ChildEntity("video")
export class Video extends Content {
    @Column()
    duration: number
}
