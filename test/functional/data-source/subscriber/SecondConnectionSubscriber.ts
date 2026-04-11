import { EntitySubscriberInterface } from "../../../../src/subscriber/EntitySubscriberInterface"
import { EventSubscriber } from "../../../../src/decorator/listeners/EventSubscriber"

@EventSubscriber()
export class SecondConnectionSubscriber implements EntitySubscriberInterface {
    /**
     * Called after entity insertion.
     */
    beforeInsert() {
        // Do nothing
    }
}
