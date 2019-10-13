import { EntitySubscriberInterface, InsertEvent, UpdateEvent } from "../../../../src/index";
import { AbstractEntity } from "../entity/AbstractEntity";
export declare class AbstractEntitySubscriber implements EntitySubscriberInterface<AbstractEntity> {
    listenTo(): typeof AbstractEntity;
    beforeInsert(event: InsertEvent<AbstractEntity>): Promise<void>;
    beforeUpdate(event: UpdateEvent<AbstractEntity>): Promise<void>;
    updateFullName(o: AbstractEntity): void;
}
