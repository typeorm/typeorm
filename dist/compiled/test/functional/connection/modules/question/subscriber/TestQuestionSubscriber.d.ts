import { EntitySubscriberInterface } from "../../../../../../src/subscriber/EntitySubscriberInterface";
import { InsertEvent } from "../../../../../../src/subscriber/event/InsertEvent";
export declare class TestQuestionSubscriber implements EntitySubscriberInterface {
    /**
     * Called before entity insertion.
     */
    beforeInsert(event: InsertEvent<any>): void;
}
