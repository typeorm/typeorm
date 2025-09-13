import { Category } from "../entity/Category"
import { EntitySubscriberInterface, EventSubscriber } from "../../../../src"

@EventSubscriber()
export class CategorySubscriber implements EntitySubscriberInterface<Category> {
    listenTo() {
        return Category
    }

    afterLoad(entity: Category) {
        entity.addedProp = true
    }
}
