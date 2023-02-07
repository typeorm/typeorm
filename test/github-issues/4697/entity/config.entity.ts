import { Entity, ObjectIdColumn, ObjectID, Column } from "../../../../src"

/**
 * @deprecated use item config instead
 */
@Entity()
export class Config {
    @ObjectIdColumn()
    _id: ObjectID

    @Column()
    itemId: string

    @Column({ type: "json" })
    data: any
}
