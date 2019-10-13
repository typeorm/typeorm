import { Post } from "../entity/Post";
import { EntitySubscriberInterface, InsertEvent, UpdateEvent } from "../../../../src";
export declare class PostSubscriber implements EntitySubscriberInterface<Post> {
    listenTo(): typeof Post;
    beforeInsert(event: InsertEvent<Post>): Promise<void>;
    beforeUpdate(event: UpdateEvent<Post>): Promise<void>;
}
