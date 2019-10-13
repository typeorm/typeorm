import { LoadEvent } from "../../../../src/subscriber/event/LoadEvent";
export declare class Post {
    id: number;
    simpleSubscriberSaw?: boolean;
    extendedSubscriberSaw?: LoadEvent<Post>;
}
