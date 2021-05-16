import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {ManyToOne} from "../../../../../../src/decorator/relations/ManyToOne";
import {Event} from "./Event";
import {User} from "./User";

@Entity()
export class EventMember {

    @ManyToOne(type => Event, event => event.members, { primary: true })
    event: Event;

    @ManyToOne(type => User, user => user.members, { primary: true })
    user: User;

}