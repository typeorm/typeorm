import {SingleEntityChild} from "../../../../../../../src/decorator/entity/SingleEntityChild";
import {OneToMany} from "../../../../../../../src/decorator/relations/OneToMany";
import {Person} from "./Person";
import {Faculty} from "./Faculty";

@SingleEntityChild()
export class Student extends Person {

    @OneToMany(type => Faculty, faculty => faculty.student)
    faculties: Faculty[];

}
