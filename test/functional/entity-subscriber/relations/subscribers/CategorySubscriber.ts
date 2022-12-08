import {
    EntitySubscriberInterface,
    EventSubscriber,
    UpdateEvent,
} from "../../../../../src"
import { Category } from "../entity/Category"

@EventSubscriber()
export class CategorySubscriber implements EntitySubscriberInterface<Category> {
    events: UpdateEvent<Category>[] = []

    listenTo() {
        return Category
    }

    afterUpdate(event: UpdateEvent<Category>): void {
        this.events.push(event)
    }
}
