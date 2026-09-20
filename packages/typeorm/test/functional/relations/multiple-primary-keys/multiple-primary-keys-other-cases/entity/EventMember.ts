import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { Event } from "./Event"
import { User } from "./User"
import { PrimaryColumn } from "../../../../../../src"

@Entity()
export class EventMember {
    @PrimaryColumn()
    userId: number

    @PrimaryColumn()
    eventId: number

    @ManyToOne(() => Event, (event) => event.members)
    event: Event

    @ManyToOne(() => User, (user) => user.members)
    user: User
}
