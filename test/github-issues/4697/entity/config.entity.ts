import { Entity, ObjectIdColumn, ObjectId, Column } from "../../../../src"

/**
 * @deprecated use item config instead
 */
@Entity()
export class Config {
    @ObjectIdColumn()
    _id: ObjectId

    @Column()
    itemId: string

    @Column({ type: "json" })
    data: any
}
