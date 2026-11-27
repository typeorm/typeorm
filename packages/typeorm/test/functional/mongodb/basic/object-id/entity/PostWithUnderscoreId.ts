import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../../../../src"

@Entity()
export class PostWithUnderscoreId {
    @ObjectIdColumn()
    _id: ObjectId

    @Column()
    title: string
}
