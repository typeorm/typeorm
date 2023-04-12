import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { ObjectIdColumn } from "../../../../../../src/decorator/columns/ObjectIdColumn"
import { ObjectId } from "../../../../../../src/driver/mongodb/typings"

@Entity()
export class PostWithUnderscoreId {
    @ObjectIdColumn()
    _id: ObjectId

    @Column()
    title: string
}
