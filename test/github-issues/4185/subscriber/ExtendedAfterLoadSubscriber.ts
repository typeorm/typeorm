import { Post } from "../entity/Post";
import { EntitySubscriberInterface, EventSubscriber, LoadEvent } from "@typeorm/core";

@EventSubscriber()
export class ExtendedAfterLoadSubscriber
    implements EntitySubscriberInterface<Post> {
    listenTo() {
        return Post;
    }

    async afterLoad(entity: Post, event: LoadEvent<Post>) {
        entity.extendedSubscriberSaw = event;
    }
}
