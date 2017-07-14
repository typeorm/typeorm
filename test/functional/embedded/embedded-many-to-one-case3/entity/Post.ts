import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Embedded} from "../../../../../src/decorator/Embedded";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Counters} from "./Counters";
import {Index} from "../../../../../src/decorator/Index";

@Entity()
@Index(["id", "counters.code", "counters.subcounters.version"])
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column(() => Counters)
    counters: Counters;

}