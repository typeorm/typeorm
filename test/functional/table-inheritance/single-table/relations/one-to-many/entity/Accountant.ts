import {SingleEntityChild} from "../../../../../../../src/decorator/entity/SingleEntityChild";
import {OneToMany} from "../../../../../../../src/decorator/relations/OneToMany";
import {Employee} from "./Employee";
import {Department} from "./Department";

@SingleEntityChild()
export class Accountant extends Employee {

    @OneToMany(type => Department, department => department.accountant)
    departments: Department[];

}
