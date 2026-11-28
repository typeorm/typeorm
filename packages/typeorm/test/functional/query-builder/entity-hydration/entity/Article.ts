import { ChildEntity, Column } from "../../../../../src"
import { Content } from "./Content"

@ChildEntity("article")
export class Article extends Content {
    @Column()
    body: string
}
