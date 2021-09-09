import {ChildEntity, OneToMany} from "../../../../../../../src";
import {Department} from "./Department";
import {Person} from "./Person";

@ChildEntity()
export class Accountant extends Person {

    @OneToMany(() => Department, department => department.person)
    data: Department[];

}
