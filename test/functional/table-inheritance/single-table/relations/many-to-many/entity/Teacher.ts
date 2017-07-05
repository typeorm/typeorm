import {SingleEntityChild} from "../../../../../../../src/decorator/entity/SingleEntityChild";
import {ManyToMany} from "../../../../../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../../../src/decorator/relations/JoinTable";
import {Employee} from "./Employee";
import {Specialization} from "./Specialization";

@SingleEntityChild()
export class Teacher extends Employee {

    @ManyToMany(type => Specialization, specialization => specialization.teachers)
    @JoinTable()
    specializations: Specialization[];

}
