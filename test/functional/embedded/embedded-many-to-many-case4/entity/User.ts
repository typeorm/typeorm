import {Column} from "../../../../../src/decorator/columns/Column";
import {Entity} from "../../../../../src/decorator/entity/Entity";
import {ManyToMany} from "../../../../../src/decorator/relations/ManyToMany";
import {Post} from "./Post";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Index} from "../../../../../src/decorator/Index";

@Entity()
@Index(["id", "personId"])
export class User {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    personId: number;

    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.counters.likedUsers)
    likedPosts: Post[];

}