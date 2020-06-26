import { Entity, LoadEvent, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Post {
    @PrimaryColumn()
    id: number;

    simpleSubscriberSaw?: boolean;
    extendedSubscriberSaw?: LoadEvent<Post>;
}
