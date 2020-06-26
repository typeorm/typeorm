import { Post } from "../entity/Post";
import { EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "@typeorm/core";

@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {
    listenTo() {
        return Post;
    }

    beforeUpdate(event: UpdateEvent<Post>) {
        event.entity.updatedColumns = event.updatedColumns.length;
    }

    afterLoad(entity: Post) {
        entity.loaded = true;
    }

}
