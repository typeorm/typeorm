import {Column} from "../../../../../../src/decorator/columns/Column";
import {Embedded} from "../../../../../../src/decorator/Embedded";
import {Information} from "./Information";

export class Counters {

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @Column(type => Information)
    information: Information;

}