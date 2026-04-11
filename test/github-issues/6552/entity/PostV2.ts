import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../../src"

@Entity()
export class PostV2 {
    @ObjectIdColumn()
    postId: ObjectId

    @Column()
    title: string
}
