import { Column, Entity, ObjectIdColumn, PrimaryColumn } from "../../../../src"

@Entity("test")
export class TestEntity {
    @ObjectIdColumn()
    _id: string

    @PrimaryColumn()
    id: string

    @Column()
    name: string
}
