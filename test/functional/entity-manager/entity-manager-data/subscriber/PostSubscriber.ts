import {EventSubscriber} from "../../../../../src/decorator/listeners/EventSubscriber";
import {EntitySubscriberInterface} from "../../../../../src/subscriber/EntitySubscriberInterface";
import {InsertEvent} from "../../../../../src/subscriber/event/InsertEvent";

@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<any> {
    
    /**
     * Called before entity insertion.
     */
    beforeInsert(event: InsertEvent<any>) {
        const user = event.manager.getData("user");
        user.name = "Updated Dima";
    }

}