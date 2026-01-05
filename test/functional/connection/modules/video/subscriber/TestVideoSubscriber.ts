import { EventSubscriber } from "../../../../../../src/decorator/listeners/EventSubscriber"
import { EntitySubscriberInterface } from "../../../../../../src/subscriber/EntitySubscriberInterface"

@EventSubscriber()
export class TestVideoSubscriber implements EntitySubscriberInterface {
    /**
     * Called after entity insertion.
     */
    beforeInsert() {
        // Do nothing
    }
}
