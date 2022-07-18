import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { Content } from "./Content"

@Entity()
export class Post extends Content {
    @Column()
    text: string
}
