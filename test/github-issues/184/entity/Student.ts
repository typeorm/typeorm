import { ChildEntity, Column } from "@typeorm/core";
import { Person, PersonType } from "./Person";

@ChildEntity(PersonType.Student) // required
export class Student extends Person {

    @Column()
    faculty: string;

    constructor() {
        super();
        this.type = 3;
    }

}
