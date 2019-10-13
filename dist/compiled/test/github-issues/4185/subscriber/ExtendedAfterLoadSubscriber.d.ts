import { Post } from "../entity/Post";
import { EntitySubscriberInterface } from "../../../../src";
import { LoadEvent } from "../../../../src/subscriber/event/LoadEvent";
export declare class ExtendedAfterLoadSubscriber implements EntitySubscriberInterface<Post> {
    listenTo(): typeof Post;
    afterLoad(entity: Post, event: LoadEvent<Post>): Promise<void>;
}
