import { Column, Entity, ObjectIdColumn } from "../../../../../../src"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: number

    @Column()
    title: string
}
