import {Column} from "../../../../../src/decorator/columns/Column";
import {Entity} from "../../../../../src/decorator/entity/Entity";
import {ManyToMany} from "../../../../../src/decorator/relations/ManyToMany";
import {Index} from "../../../../../src/decorator/Index";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Post} from "./Post";

@Entity()
@Index(["id", "personId"], { unique: true })
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