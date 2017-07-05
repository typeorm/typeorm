import {Entity} from "../../../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../../../src/decorator/columns/Column";
import {Embedded} from "../../../../../../../src/decorator/Embedded";
import {Index} from "../../../../../../../src/decorator/Index";
import {Counters} from "./Counters";
import {PrimaryColumn} from "../../../../../../../src/decorator/columns/PrimaryColumn";

@Entity()
@Index(["id", "counters.code", "counters.subcounters.version"], { unique: true })
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column(() => Counters)
    counters: Counters;

}