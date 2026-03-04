import { ObjectId } from "mongodb"
import {
    Column,
    DeleteDateColumn,
    Entity,
    ObjectIdColumn,
} from "../../../../../../src"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    title: string

    @Column()
    text: string

    // @Column(() => Counters)
    // counters: Counters;
}

@Entity()
export class PostWithDeleted {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    title: string

    @Column()
    text: string

    @DeleteDateColumn()
    deletedAt: Date | null
}
