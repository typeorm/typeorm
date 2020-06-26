import { ChildEntity, JoinTable, ManyToMany } from "@typeorm/core";
import { Person } from "./Person";
import { Faculty } from "./Faculty";

@ChildEntity()
export class Student extends Person {

    @ManyToMany(type => Faculty, faculty => faculty.students)
    @JoinTable()
    faculties: Faculty[];

}
