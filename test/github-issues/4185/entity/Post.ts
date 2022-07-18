import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { LoadEvent } from "typeorm/subscriber/event/LoadEvent"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    simpleSubscriberSaw?: boolean
    extendedSubscriberSaw?: LoadEvent<Post>
}
