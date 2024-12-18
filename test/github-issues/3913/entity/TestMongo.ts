import { ObjectId } from "mongodb"
import { BaseEntity, Column, Entity, ObjectIdColumn } from "../../../../src"

export class Embedded {
    a: string
}

@Entity()
export class TestMongo extends BaseEntity {
    @ObjectIdColumn()
    _id: ObjectId

    @Column(() => Embedded, { nullable: true })
    embedded: Embedded | null
}
