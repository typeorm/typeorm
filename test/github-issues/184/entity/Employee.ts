import { ChildEntity, Column } from "@typeorm/core";
import { Person, PersonType } from "./Person";

@ChildEntity(PersonType.Employee)
export class Employee extends Person {

    @Column()
    salary: number;

    @Column()
    shared: string;

    constructor() {
        super();
        this.type = 1;
    }

}
