import {Entity} from "../../../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../../src/decorator/columns/PrimaryColumn";
import {Index} from "../../../../../../../src/decorator/Index";
import {ManyToMany} from "../../../../../../../src/decorator/relations/ManyToMany";
import {Post} from "./Post";

@Entity()
@Index(["id", "name"])
export class User {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    name: string;

    @ManyToMany(type => Post, post => post.counters.subcounters.watchedUsers)
    posts: Post[];

    postIds: number[];

}