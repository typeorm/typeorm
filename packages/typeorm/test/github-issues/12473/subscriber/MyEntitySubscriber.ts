import { EntitySubscriberInterface, EventSubscriber } from "../../../../src"
import type { InsertEvent } from "../../../../src/subscriber/event/InsertEvent"
import type { UpdateEvent } from "../../../../src/subscriber/event/UpdateEvent"
import { MyEntity } from "../entity/MyEntity"

@EventSubscriber()
export class MyEntitySubscriber implements EntitySubscriberInterface<MyEntity> {
    public lastAfterInsertEntity?: Partial<MyEntity>
    public lastAfterUpdateEntity?: Partial<MyEntity>

    listenTo() {
        return MyEntity
    }

    afterInsert(event: InsertEvent<MyEntity>) {
        this.lastAfterInsertEntity = { ...event.entity }
    }

    afterUpdate(event: UpdateEvent<MyEntity>) {
        this.lastAfterUpdateEntity = event.entity
            ? { ...event.entity }
            : undefined
    }
}
