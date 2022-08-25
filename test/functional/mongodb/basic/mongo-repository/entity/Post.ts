import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { ObjectIdColumn } from "../../../../../../src/decorator/columns/ObjectIdColumn"
import { ObjectID } from "../../../../../../src/driver/mongodb/typings"
import { DeleteDateColumn } from "../../../../../../src"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectID

    @Column()
    title: string

    @Column()
    text: string

    // @Column(() => Counters)
    // counters: Counters;
}

@Entity()
export class PostWithDeleted {
    @ObjectIdColumn()
    id: ObjectID

    @Column()
    title: string

    @Column()
    text: string

    @DeleteDateColumn()
    deletedAt: Date | null
}
