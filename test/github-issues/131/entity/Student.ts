import {Column} from "../../../../src/decorator/columns/Column";
import {Person} from "./Person";
import {SingleEntityChild} from "../../../../src/decorator/entity/SingleEntityChild";

@SingleEntityChild()
export class Student extends Person {

    @Column()
    faculty: string;

}
