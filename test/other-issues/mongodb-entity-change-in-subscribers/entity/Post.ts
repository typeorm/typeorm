import { Entity } from "../../../../src/decorator/entity/Entity"
import { Column } from "../../../../src/decorator/columns/Column"
import { UpdateDateColumn } from "../../../../src/decorator/columns/UpdateDateColumn"
import { ObjectID, ObjectIdColumn } from "../../../../src"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectID

    @Column()
    title: string

    @Column()
    active: boolean = false

    @UpdateDateColumn()
    updateDate: Date

    @Column()
    updatedColumns: number | string[] = 0

    loaded: boolean = false
}
