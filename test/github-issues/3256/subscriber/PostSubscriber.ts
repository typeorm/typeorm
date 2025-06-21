import { Post } from "../entity/Post"
import {
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent,
    UpdateEvent,
} from "../../../../src"

@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {
    listenTo() {
        return Post
    }

    beforeInsert(event: InsertEvent<Post>) {
        event.entity.inserted = true
    }

    beforeUpdate(event: UpdateEvent<Post>) {
        if (event.entity) {
            event.entity.updated = true
        }
    }
}
