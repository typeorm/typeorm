import {Entity} from "../../../../../src/decorator/entity/Entity";
import {OneToMany} from "../../../../../src/decorator/relations/OneToMany";
import {Index} from "../../../../../src/decorator/Index";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Post} from "./Post";

@Entity()
@Index(["id", "personId"])
export class User {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    personId: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.counters.likedUser)
    likedPosts: Post[];

}