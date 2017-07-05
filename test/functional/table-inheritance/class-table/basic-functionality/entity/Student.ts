import {Column} from "../../../../../../src/decorator/columns/Column";
import {ClassEntityChild} from "../../../../../../src/decorator/entity/ClassEntityChild";
import {Person} from "./Person";

@ClassEntityChild()
export class Student extends Person {

    @Column()
    faculty: string;

}
