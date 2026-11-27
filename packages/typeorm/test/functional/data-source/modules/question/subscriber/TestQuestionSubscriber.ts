import { EventSubscriber } from "../../../../../../src/decorator/listeners/EventSubscriber"
import { EntitySubscriberInterface } from "../../../../../../src/subscriber/EntitySubscriberInterface"

@EventSubscriber()
export class TestQuestionSubscriber implements EntitySubscriberInterface {
    /**
     * Called before entity insertion.
     */
    beforeInsert() {
        // Do nothing
    }
}
