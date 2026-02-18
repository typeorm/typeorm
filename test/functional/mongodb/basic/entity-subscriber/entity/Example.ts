import { Column, Entity, ObjectId, ObjectIdColumn } from "../../../../../../src"

@Entity()
export class Example {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    value: number = 0
}

@Entity()
export class AnotherExample {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    name: string = ""
}
