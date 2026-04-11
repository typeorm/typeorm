import { ObjectId } from "mongodb"
import { Column, Entity, Index, ObjectIdColumn } from "../../../../../../src"
import { Information } from "./Information"

@Entity()
@Index("info_description", ["info.description"])
export class Post {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    title: string

    @Column()
    name: string

    @Column(() => Information)
    info: Information
}
