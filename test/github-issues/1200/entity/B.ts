import {Column} from "../../../../src/decorator/columns/Column";
import {C} from "./C";

export class B {

    constructor() {
        this.c = new C();
    }

    @Column(type => C)
    c: C;

    @Column()
    n: number;
}