import {Column} from "../../../../../../src/decorator/columns/Column";
import {ClassEntityChild} from "../../../../../../src/decorator/entity/ClassEntityChild";
import {Employee} from "./Employee";

@ClassEntityChild()
export class Accountant extends Employee {

    @Column()
    department: string;

}
