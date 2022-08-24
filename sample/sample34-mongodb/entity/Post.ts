import { Column, Entity } from "../../../src/index"
import { ObjectIdColumn } from "../../../src/decorator/columns/ObjectIdColumn"
import { ObjectID } from "../../../src/driver/mongodb/typings"

@Entity("sample34_post")
export class Post {
    @ObjectIdColumn()
    id: ObjectID

    @Column()
    title: string

    @Column()
    text: string

    @Column("int", {
        nullable: false,
    })
    likesCount: number
}
