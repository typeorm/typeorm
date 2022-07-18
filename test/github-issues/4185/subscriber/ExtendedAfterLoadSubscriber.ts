import { Post } from "../entity/Post"
import { EntitySubscriberInterface, EventSubscriber } from "typeorm"
import { LoadEvent } from "typeorm/subscriber/event/LoadEvent"

@EventSubscriber()
export class ExtendedAfterLoadSubscriber
    implements EntitySubscriberInterface<Post>
{
    listenTo() {
        return Post
    }

    async afterLoad(entity: Post, event: LoadEvent<Post>) {
        entity.extendedSubscriberSaw = event
    }
}
