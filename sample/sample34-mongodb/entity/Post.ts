import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../src/"

@Entity("sample34_post")
export class Post {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    title: string

    @Column()
    text: string

    @Column("int", {
        nullable: false,
    })
    likesCount: number
}
