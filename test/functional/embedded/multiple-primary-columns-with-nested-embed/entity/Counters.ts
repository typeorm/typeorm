import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Embedded} from "../../../../../src/decorator/Embedded";
import {Subcounters} from "./Subcounters";

export class Counters {

    @PrimaryColumn()
    code: number;

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @Column(() => Subcounters)
    subcounters: Subcounters;

}