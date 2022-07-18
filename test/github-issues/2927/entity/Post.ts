import { ChildEntity, Column } from "typeorm"
import { Content, ContentType } from "./Content"

@ChildEntity(ContentType.Post)
export class Post extends Content {
    @Column()
    viewCount: number
}
