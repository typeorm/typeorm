import {Entity} from "../../../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../../src/decorator/columns/PrimaryColumn";
import {Index} from "../../../../../../../src/decorator/Index";
import {ManyToOne} from "../../../../../../../src/decorator/relations/ManyToOne";
import {Post} from "./Post";

@Entity()
@Index(["id", "name"])
export class User {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    name: string;

    @ManyToOne(type => Post, post => post.counters.subcounters.watchedUsers)
    post: Post;

}