import {Column} from "../../../../../../src/decorator/columns/Column";
import {SingleEntityChild} from "../../../../../../src/decorator/entity/SingleEntityChild";
import {Person} from "./Person";

@SingleEntityChild()
export class Student extends Person {

    @Column()
    faculty: string;

}
