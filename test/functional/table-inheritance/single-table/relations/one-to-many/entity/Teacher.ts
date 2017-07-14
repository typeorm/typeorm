import {SingleEntityChild} from "../../../../../../../src/decorator/entity/SingleEntityChild";
import {OneToMany} from "../../../../../../../src/decorator/relations/OneToMany";
import {Employee} from "./Employee";
import {Specialization} from "./Specialization";

@SingleEntityChild()
export class Teacher extends Employee {

    @OneToMany(type => Specialization, specialization => specialization.teacher)
    specializations: Specialization[];

}
