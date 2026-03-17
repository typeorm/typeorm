import { EventSubscriber } from "../../../../../../src/decorator/listeners/EventSubscriber"
import { EntitySubscriberInterface } from "../../../../../../src/subscriber/EntitySubscriberInterface"

@EventSubscriber()
export class TestBlogSubscriber implements EntitySubscriberInterface {
    /**
     * Called after entity insertion.
     */
    beforeInsert() {
        // Do nothing
    }
}
