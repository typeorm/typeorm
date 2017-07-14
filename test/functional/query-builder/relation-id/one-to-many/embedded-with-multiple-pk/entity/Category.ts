import {Entity} from "../../../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../../src/decorator/columns/PrimaryColumn";
import {Index} from "../../../../../../../src/decorator/Index";
import {Post} from "./Post";
import {ManyToOne} from "../../../../../../../src/decorator/relations/ManyToOne";

@Entity()
@Index(["id", "name"])
export class Category {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    name: string;

    @ManyToOne(type => Post, post => post.counters.categories)
    post: Post;

}