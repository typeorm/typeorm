import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { ObjectIdColumn } from "../../../../../../src/decorator/columns/ObjectIdColumn"
import { ObjectID } from "../../../../../../src/driver/mongodb/typings"

@Entity()
export class PostWithUnderscoreId {
    @ObjectIdColumn()
    _id: ObjectID

    @Column()
    title: string
}
