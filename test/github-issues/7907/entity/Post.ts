import { Entity } from "../../../../src/decorator/entity/Entity"
import { Column } from "../../../../src/decorator/columns/Column"
import { ObjectIdColumn } from "../../../../src/decorator/columns/ObjectIdColumn"
// import { ObjectId } from "mongodb";
import { ObjectID } from "../../../../src"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectID

    @Column()
    title: string

    @Column()
    text: string
}
