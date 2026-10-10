import { Column, Entity, ObjectIdColumn } from "../../../../../../src"
import { ObjectId } from "mongodb"

@Entity()
export class Example {
    @ObjectIdColumn()
    _id: ObjectId

    @Column()
    value: number = 0
}

@Entity()
export class AnotherExample {
    @ObjectIdColumn()
    _id: ObjectId

    @Column()
    name: string = ""
}
