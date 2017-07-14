import {Column} from "../../../../../../src/decorator/columns/Column";
import {SingleEntityChild} from "../../../../../../src/decorator/entity/SingleEntityChild";
import {Employee} from "./Employee";

@SingleEntityChild()
export class Teacher extends Employee {

    @Column()
    specialization: string;

}
