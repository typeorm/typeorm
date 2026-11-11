import type {
    EntitySubscriberInterface,
    SoftRemoveEvent,
} from "../../../../../../src"
import { EventSubscriber } from "../../../../../../src"
import { PostWithDeleteDateColumn } from "../entity/PostWithDeleteDateColumn"

@EventSubscriber()
export class PostWithDeleteDateColumnSubscriber implements EntitySubscriberInterface<PostWithDeleteDateColumn> {
    listenTo() {
        return PostWithDeleteDateColumn
    }

    beforeSoftRemove(event: SoftRemoveEvent<PostWithDeleteDateColumn>) {
        if (event.entity) event.entity.description = "Soft-removed"
    }
}
