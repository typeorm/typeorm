import {Entity} from "../../../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../../../src/decorator/columns/Column";
import {Embedded} from "../../../../../../../src/decorator/Embedded";
import {Counters} from "./Counters";

@Entity()
export class Post {

    @Column()
    title: string;

    @Column(() => Counters)
    counters: Counters;

}