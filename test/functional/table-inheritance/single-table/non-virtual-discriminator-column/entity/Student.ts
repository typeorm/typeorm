import { ChildEntity, Column } from "@typeorm/core";
import { Person } from "./Person";

@ChildEntity("student-type")
export class Student extends Person {

    @Column()
    faculty: string;

}
