import { Post } from "../entity/Post";
import { EntitySubscriberInterface, UpdateEvent } from "../../../../src";
export declare class PostSubscriber implements EntitySubscriberInterface<Post> {
    listenTo(): typeof Post;
    beforeUpdate(event: UpdateEvent<Post>): void;
    afterLoad(entity: Post): void;
}
