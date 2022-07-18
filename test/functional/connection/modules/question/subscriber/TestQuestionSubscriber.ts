import { EventSubscriber } from "typeorm/decorator/listeners/EventSubscriber"
import { EntitySubscriberInterface } from "typeorm/subscriber/EntitySubscriberInterface"
import { InsertEvent } from "typeorm/subscriber/event/InsertEvent"

@EventSubscriber()
export class TestQuestionSubscriber implements EntitySubscriberInterface {
    /**
     * Called before entity insertion.
     */
    beforeInsert(event: InsertEvent<any>) {
        // Do nothing
    }
}
