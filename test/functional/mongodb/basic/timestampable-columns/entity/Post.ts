import { ObjectId } from "mongodb"
import {
    Column,
    CreateDateColumn,
    Entity,
    ObjectIdColumn,
    UpdateDateColumn,
} from "../../../../../../src"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectId

    @Column()
    message: string

    @Column()
    @CreateDateColumn()
    createdAt: Date

    @Column()
    @UpdateDateColumn()
    updatedAt: Date
}
