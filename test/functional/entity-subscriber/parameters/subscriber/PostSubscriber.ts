import { Post } from "../entity/Post"
import {
    EntitySubscriberInterface,
    EventSubscriber,
    UpdateEvent,
} from "../../../../../src"

@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {
    static receivedEvents: UpdateEvent<Post>[] = []

    listenTo() {
        return Post
    }

    afterUpdate(event: UpdateEvent<Post>) {
        PostSubscriber.receivedEvents.push(event)
    }
}
