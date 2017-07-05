import {Entity} from "../../../../../../../src/decorator/entity/Entity";
import {ManyToMany} from "../../../../../../../src/decorator/relations/ManyToMany";
import {PrimaryColumn} from "../../../../../../../src/decorator/columns/PrimaryColumn";
import {Post} from "./Post";
import {Index} from "../../../../../../../src/decorator/Index";

@Entity()
@Index(["id", "name"])
export class Category {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    name: string;

    @ManyToMany(type => Post, post => post.counters.categories)
    posts: Post[];

    postIds: number[];

}