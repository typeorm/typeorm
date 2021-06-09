import {Entity, ManyToOne} from "../../../../../../../src";
import {Accountant} from "./Accountant";
import {Data} from "./Data";

@Entity("data")
export class Department extends Data {

    @ManyToOne(() => Accountant, accountant => accountant.data)
    person: Accountant;

}
