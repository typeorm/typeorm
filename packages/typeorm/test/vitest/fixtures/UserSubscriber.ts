import { EventSubscriber } from "../../../src/index"
import type { EntitySubscriberInterface, InsertEvent } from "../../../src/index"
import { User } from "./User"

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
    inserts = 0

    listenTo() {
        return User
    }

    beforeInsert(event: InsertEvent<User>) {
        this.inserts++
        event.entity.name = event.entity.name.toUpperCase()
    }
}
