import { EntitySubscriberInterface } from "typeorm/subscriber/EntitySubscriberInterface"
import { EventSubscriber } from "typeorm/decorator/listeners/EventSubscriber"
import { InsertEvent } from "typeorm/subscriber/event/InsertEvent"

@EventSubscriber()
export class FirstConnectionSubscriber implements EntitySubscriberInterface {
    /**
     * Called after entity insertion.
     */
    beforeInsert(event: InsertEvent<any>) {
        // Do nothing
    }
}
