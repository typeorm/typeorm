import { Entity } from "../typeorm/decorator/entity/Entity"
import { Column } from "../typeorm/decorator/columns/Column"
import { ObjectIdColumn } from "../typeorm/decorator/columns/ObjectIdColumn"
import { ObjectID } from "../typeorm/driver/mongodb/typings"
import { CreateDateColumn } from "../typeorm/decorator/columns/CreateDateColumn"
import { UpdateDateColumn } from "../typeorm/decorator/columns/UpdateDateColumn"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: ObjectID

    @Column()
    message: string

    @Column()
    @CreateDateColumn()
    createdAt: Date

    @Column()
    @UpdateDateColumn()
    updatedAt: Date
}
