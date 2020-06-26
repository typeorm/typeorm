import { ChildEntity, OneToMany } from "@typeorm/core";
import { Person } from "./Person";
import { Faculty } from "./Faculty";

@ChildEntity()
export class Student extends Person {

    @OneToMany(type => Faculty, faculty => faculty.student)
    faculties: Faculty[];

}
