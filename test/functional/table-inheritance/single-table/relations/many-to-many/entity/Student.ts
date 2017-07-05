import {SingleEntityChild} from "../../../../../../../src/decorator/entity/SingleEntityChild";
import {ManyToMany} from "../../../../../../../src/decorator/relations/ManyToMany";
import {Person} from "./Person";
import {Faculty} from "./Faculty";
import {JoinTable} from "../../../../../../../src/decorator/relations/JoinTable";

@SingleEntityChild()
export class Student extends Person {

    @ManyToMany(type => Faculty, faculty => faculty.students)
    @JoinTable()
    faculties: Faculty[];

}
