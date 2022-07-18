import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { UpdateDateColumn } from "typeorm/decorator/columns/UpdateDateColumn"
import { ObjectID, ObjectIdColumn } from "typeorm"

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
