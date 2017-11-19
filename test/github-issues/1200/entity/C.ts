import {Column} from "../../../../src/decorator/columns/Column";
import {D} from "./D";

export class C {

    constructor() {
        this.d = new D();
    }

    @Column(type => D)
    d: D;

    @Column()
    n: number;
}