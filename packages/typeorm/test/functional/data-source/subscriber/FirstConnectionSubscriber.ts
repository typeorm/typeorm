import { EntitySubscriberInterface } from "../../../../src/subscriber/EntitySubscriberInterface"
import { EventSubscriber } from "../../../../src/decorator/listeners/EventSubscriber"

@EventSubscriber()
export class FirstConnectionSubscriber implements EntitySubscriberInterface {
    /**
     * Called after entity insertion.
     */
    beforeInsert() {
        // Do nothing
    }
}
