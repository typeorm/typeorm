import { Post } from "../entity/Post"
import {
    EntitySubscriberInterface,
    EventSubscriber,
    SoftRemoveEvent,
    UpdateEvent,
} from "../../../../../src"

@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {
    static receivedAfterUpdateEvents: UpdateEvent<Post>[] = []
    static receivedAfterSoftRemoveEvents: SoftRemoveEvent<Post>[] = []

    listenTo() {
        return Post
    }

    afterUpdate(event: UpdateEvent<Post>) {
        PostSubscriber.receivedAfterUpdateEvents.push(event)
    }

    afterSoftRemove(event: SoftRemoveEvent<Post>): Promise<any> | void {
        PostSubscriber.receivedAfterSoftRemoveEvents.push(event)
    }
}
