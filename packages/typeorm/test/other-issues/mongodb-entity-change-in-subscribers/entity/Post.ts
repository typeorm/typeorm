import { ObjectId } from "mongodb"
import {
    Column,
    Entity,
    ObjectIdColumn,
    UpdateDateColumn,
} from "../../../../src"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectId

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
