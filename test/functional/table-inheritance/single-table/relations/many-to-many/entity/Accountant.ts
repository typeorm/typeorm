import {SingleEntityChild} from "../../../../../../../src/decorator/entity/SingleEntityChild";
import {ManyToMany} from "../../../../../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../../../src/decorator/relations/JoinTable";
import {Employee} from "./Employee";
import {Department} from "./Department";

@SingleEntityChild()
export class Accountant extends Employee {

    @ManyToMany(type => Department, department => department.accountants)
    @JoinTable()
    departments: Department[];

}
