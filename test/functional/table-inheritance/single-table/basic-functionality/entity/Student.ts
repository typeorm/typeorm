import { ChildEntity, Column } from "@typeorm/core";
import { Person } from "./Person";

@ChildEntity()
export class Student extends Person {

    @Column()
    faculty: string;

}
