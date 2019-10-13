import { Post } from "../entity/Post";
import { EntitySubscriberInterface } from "../../../../src";
export declare class SimpleAfterLoadSubscriber implements EntitySubscriberInterface<Post> {
    listenTo(): typeof Post;
    afterLoad(entity: Post): Promise<void>;
}
