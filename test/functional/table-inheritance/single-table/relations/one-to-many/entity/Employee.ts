import {Column} from "../../../../../../../src/decorator/columns/Column";
import {SingleEntityChild} from "../../../../../../../src/decorator/entity/SingleEntityChild";
import {Person} from "./Person";

@SingleEntityChild()
export class Employee extends Person {

    @Column()
    salary: number;

}
