import { Column, Entity, ObjectId, ObjectIdColumn } from "../../../../src"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    title: string
}
