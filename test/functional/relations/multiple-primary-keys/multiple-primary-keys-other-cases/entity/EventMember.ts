import { Entity } from "../typeorm/decorator/entity/Entity"
import { ManyToOne } from "../typeorm/decorator/relations/ManyToOne"
import { Event } from "./Event"
import { User } from "./User"
import { PrimaryColumn } from "../typeorm"

@Entity()
export class EventMember {
    @PrimaryColumn()
    userId: number

    @PrimaryColumn()
    eventId: number

    @ManyToOne((type) => Event, (event) => event.members)
    event: Event

    @ManyToOne((type) => User, (user) => user.members)
    user: User
}
