import {ChildEntity, OneToMany} from "../../../../../../../src";
import {Specialization} from "./Specialization";
import {Person} from "./Person";

@ChildEntity()
export class Teacher extends Person {

    @OneToMany(() => Specialization, specialization => specialization.person)
    data: Specialization[];

}
