import { Entity } from "../typeorm/decorator/entity/Entity"
import { Column } from "../typeorm/decorator/columns/Column"
import { ObjectIdColumn } from "../typeorm/decorator/columns/ObjectIdColumn"
import { Index } from "../typeorm/decorator/Index"
import { ObjectID } from "../typeorm/driver/mongodb/typings"
import { Information } from "./Information"

@Entity()
@Index("info_description", ["info.description"])
export class Post {
    @ObjectIdColumn()
    id: ObjectID

    @Column()
    title: string

    @Column()
    name: string

    @Column(() => Information)
    info: Information
}
