import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../../../../src"
@Entity()
export class Post {
    @ObjectIdColumn()
    nonIdNameOfObjectId: ObjectId

    @Column()
    title: string
}
