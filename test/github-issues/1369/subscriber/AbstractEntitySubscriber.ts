import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from "@typeorm/core";
import { AbstractEntity } from "../entity/AbstractEntity";

@EventSubscriber()
export class AbstractEntitySubscriber implements EntitySubscriberInterface<AbstractEntity> {
    listenTo() {
        return AbstractEntity;
    }

    async beforeInsert(event: InsertEvent<AbstractEntity>) {
        this.updateFullName(event.entity);
    }

    async beforeUpdate(event: UpdateEvent<AbstractEntity>) {
        this.updateFullName(event.entity);
    }

    updateFullName(o: AbstractEntity) {
        o.fullname = o.firstname + " " + o.lastname;
    }
}
